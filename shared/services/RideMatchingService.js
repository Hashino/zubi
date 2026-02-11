/**
 * RideMatchingService - Core matching logic for P2P rides with Nostr
 * 
 * This service manages the entire ride lifecycle using decentralized P2P:
 * 1. Passenger requests ride via Nostr
 * 2. Find nearby available drivers (announced via Nostr)
 * 3. Match passenger with driver through P2P messaging
 * 4. Track ride progress with cryptographic presence tokens
 * 5. Handle completion and payment via smart contracts
 * 
 * Implements the PMCD (Protocolo de Mobilidade Cooperativa Descentralizada)
 */

import StorageService from './StorageService';
import NostrService from './NostrService';
import KeyManagementService from './KeyManagementService';

export const RideStatus = {
  REQUESTED: 'REQUESTED',
  SEARCHING: 'SEARCHING',
  MATCHED: 'MATCHED',
  DRIVER_ARRIVING: 'DRIVER_ARRIVING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

class RideMatchingService {
  constructor() {
    // Hybrid architecture: Local cache + P2P network
    this.availableDrivers = new Map(); // Local cache of Nostr announcements
    this.activeRides = new Map();
    this.rideRequests = new Map();
    
    // Event listeners for real-time updates
    this.listeners = new Map();
    
    // Nostr connection status
    this.nostrConnected = false;
    this.nostrInitialized = false;
    
    // Initialize Nostr asynchronously (not awaited in constructor)
    this.initializeNostr().catch(err => {
      console.error('[RideMatchingService] Nostr init failed:', err);
    });
  }

  /**
   * Initialize Nostr connection for P2P
   */
  async initializeNostr() {
    if (this.nostrInitialized) {
      return;
    }
    
    try {
      const result = await NostrService.connect();
      if (result.success) {
        this.nostrConnected = true;
        this.nostrInitialized = true;
        console.log('[RideMatchingService] Nostr P2P initialized');
        
        // Subscribe to user-specific events
        await NostrService.subscribeToUserEvents(this.handleNostrEvent.bind(this));
      } else {
        console.warn('[RideMatchingService] Nostr connection failed, using fallback');
      }
    } catch (error) {
      console.error('[RideMatchingService] Nostr init error:', error);
    }
  }

  /**
   * Handle incoming Nostr events (ride requests, acceptances, etc)
   */
  handleNostrEvent(event) {
    try {
      const content = JSON.parse(event.content);
      
      switch (content.type) {
        case 'ride_request':
          // Driver receives ride request
          this.emit(`rideRequest:${event.tags.find(t => t[0] === 'p')[1]}`, content);
          break;
        case 'ride_accepted':
          // Passenger receives acceptance
          this.emit(`rideAccepted:${content.passengerId}`, content);
          break;
        case 'ride_cancelled':
          this.emit(`rideCancelled:${content.userId}`, content);
          break;
        default:
          console.log('[RideMatchingService] Unknown Nostr event type:', content.type);
      }
    } catch (error) {
      console.error('[RideMatchingService] Error handling Nostr event:', error);
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Calculate estimated fare based on distance
   */
  calculateFare(distanceKm) {
    const BASE_FARE = 5.0; // R$ 5 base
    const PER_KM = 2.5; // R$ 2.50 per km
    const MIN_FARE = 8.0; // R$ 8 minimum
    
    const fare = BASE_FARE + (distanceKm * PER_KM);
    return Math.max(fare, MIN_FARE);
  }

  /**
   * Driver announces availability (goes online) - P2P via Nostr
   */
  async announceDriverAvailability(driverProfile, location) {
    const driver = {
      id: driverProfile.id,
      name: driverProfile.name,
      vehicle: driverProfile.vehicle,
      plate: driverProfile.plate,
      rating: driverProfile.rating,
      level: driverProfile.level || 'iniciante',
      xp: driverProfile.xp || 0,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      isAvailable: true,
      timestamp: Date.now(),
    };

    // Cache locally
    this.availableDrivers.set(driverProfile.id, driver);
    
    // Announce via Nostr P2P network
    if (this.nostrConnected) {
      try {
        await NostrService.announceDriver({
          driverId: driver.id,
          name: driver.name,
          vehicle: driver.vehicle,
          rating: driver.rating,
          level: driver.level,
          location: driver.location,
        });
        console.log('[RideMatchingService] Driver announced on Nostr P2P network');
      } catch (error) {
        console.warn('[RideMatchingService] Failed to announce on Nostr, using local only:', error);
      }
    }
    
    // Notify local listeners
    this.emit('driverOnline', driver);
    
    return { success: true, driverId: driverProfile.id };
  }

  /**
   * Driver goes offline
   */
  async removeDriverAvailability(driverId) {
    this.availableDrivers.delete(driverId);
    this.emit('driverOffline', driverId);
    return { success: true };
  }

  /**
   * Update driver location in real-time
   */
  async updateDriverLocation(driverId, location) {
    const driver = this.availableDrivers.get(driverId);
    if (driver) {
      driver.location = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
      driver.timestamp = Date.now();
      this.availableDrivers.set(driverId, driver);
      
      // Notify rides where this driver is involved
      this.emit(`driverLocation:${driverId}`, location);
    }
  }

  /**
   * Find nearby drivers for a passenger location - Uses Nostr P2P
   */
  async findNearbyDrivers(passengerLocation, maxDistanceKm = 5) {
    let nearbyDrivers = [];
    
    // Try P2P first (Nostr)
    if (this.nostrConnected) {
      try {
        const nostrResult = await NostrService.findNearbyDrivers(passengerLocation, maxDistanceKm);
        if (nostrResult.success && nostrResult.drivers.length > 0) {
          nearbyDrivers = nostrResult.drivers.map(driver => ({
            ...driver,
            estimatedArrival: Math.ceil(driver.distance * 3), // ~3 min per km
          }));
          
          // Update local cache
          nearbyDrivers.forEach(driver => {
            this.availableDrivers.set(driver.driverId || driver.id, driver);
          });
          
          console.log('[RideMatchingService] Found', nearbyDrivers.length, 'drivers via Nostr P2P');
          return nearbyDrivers;
        }
      } catch (error) {
        console.warn('[RideMatchingService] Nostr search failed, falling back to local:', error);
      }
    }
    
    // Fallback: Use local cache
    for (const [driverId, driver] of this.availableDrivers) {
      if (!driver.isAvailable) continue;
      
      const distance = this.calculateDistance(
        passengerLocation.latitude,
        passengerLocation.longitude,
        driver.location.latitude,
        driver.location.longitude
      );
      
      if (distance <= maxDistanceKm) {
        nearbyDrivers.push({
          ...driver,
          distance: parseFloat(distance.toFixed(2)),
          estimatedArrival: Math.ceil(distance * 3), // ~3 min per km
        });
      }
    }
    
    // Sort by distance (closest first)
    nearbyDrivers.sort((a, b) => a.distance - b.distance);
    
    console.log('[RideMatchingService] Found nearby drivers:', nearbyDrivers.length, 'total available:', this.availableDrivers.size);
    
    return nearbyDrivers;
  }

  /**
   * Passenger requests a ride
   */
  async requestRide(passengerProfile, origin, destination) {
    const rideId = `ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate estimated distance and fare
    const distanceKm = this.calculateDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );
    
    const estimatedFare = this.calculateFare(distanceKm);
    
    const rideRequest = {
      id: rideId,
      passengerId: passengerProfile.id,
      passengerName: passengerProfile.name,
      passengerPhone: passengerProfile.phone,
      passengerRating: passengerProfile.rating || 5.0,
      origin: {
        latitude: origin.latitude,
        longitude: origin.longitude,
        address: origin.address || 'Origem',
      },
      destination: {
        latitude: destination.latitude,
        longitude: destination.longitude,
        address: destination.address || 'Destino',
      },
      estimatedDistance: parseFloat(distanceKm.toFixed(2)),
      estimatedFare: parseFloat(estimatedFare.toFixed(2)),
      status: RideStatus.SEARCHING,
      requestedAt: Date.now(),
    };
    
    this.rideRequests.set(rideId, rideRequest);
    
    // Find nearby drivers and notify them
    const nearbyDrivers = await this.findNearbyDrivers(origin);
    
    if (nearbyDrivers.length === 0) {
      rideRequest.status = RideStatus.CANCELLED;
      return {
        success: false,
        error: 'Nenhum motorista disponível na região',
        rideId,
      };
    }
    
    // Notify nearby drivers about the ride request
    nearbyDrivers.forEach(driver => {
      this.emit(`rideRequest:${driver.id}`, rideRequest);
    });
    
    return {
      success: true,
      rideId,
      ride: rideRequest,
      nearbyDrivers: nearbyDrivers.length,
    };
  }

  /**
   * Driver accepts a ride request
   */
  async acceptRide(driverId, rideId) {
    const rideRequest = this.rideRequests.get(rideId);
    if (!rideRequest) {
      return { success: false, error: 'Corrida não encontrada' };
    }
    
    if (rideRequest.status !== RideStatus.SEARCHING) {
      return { success: false, error: 'Corrida já foi aceita por outro motorista' };
    }
    
    const driver = this.availableDrivers.get(driverId);
    if (!driver) {
      return { success: false, error: 'Motorista não encontrado' };
    }
    
    // Create active ride
    const ride = {
      ...rideRequest,
      driverId: driver.id,
      driverName: driver.name,
      driverVehicle: driver.vehicle,
      driverPlate: driver.plate,
      driverRating: driver.rating,
      driverLevel: driver.level,
      driverLocation: driver.location,
      status: RideStatus.MATCHED,
      acceptedAt: Date.now(),
    };
    
    this.activeRides.set(rideId, ride);
    this.rideRequests.delete(rideId);
    
    // Mark driver as unavailable
    driver.isAvailable = false;
    this.availableDrivers.set(driverId, driver);
    
    // Notify passenger
    this.emit(`rideAccepted:${ride.passengerId}`, ride);
    
    // Save to storage
    await this.saveRideToHistory(ride);
    
    return { success: true, ride };
  }

  /**
   * Driver rejects a ride request
   */
  async rejectRide(driverId, rideId, reason = 'Motorista recusou') {
    const rideRequest = this.rideRequests.get(rideId);
    if (!rideRequest) {
      return { success: false, error: 'Corrida não encontrada' };
    }
    
    // Just log the rejection, don't cancel the ride
    // Other drivers can still accept
    this.emit(`rideRejected:${rideId}`, { driverId, reason });
    
    return { success: true };
  }

  /**
   * Update ride status
   */
  async updateRideStatus(rideId, newStatus, additionalData = {}) {
    const ride = this.activeRides.get(rideId);
    if (!ride) {
      return { success: false, error: 'Corrida não encontrada' };
    }
    
    ride.status = newStatus;
    ride.updatedAt = Date.now();
    
    // Add any additional data
    Object.assign(ride, additionalData);
    
    this.activeRides.set(rideId, ride);
    
    // Notify both passenger and driver
    this.emit(`rideStatusUpdate:${ride.passengerId}`, ride);
    this.emit(`rideStatusUpdate:${ride.driverId}`, ride);
    
    // Update storage
    await this.saveRideToHistory(ride);
    
    return { success: true, ride };
  }

  /**
   * Start the ride (passenger enters vehicle)
   */
  async startRide(rideId) {
    return await this.updateRideStatus(rideId, RideStatus.IN_PROGRESS, {
      startedAt: Date.now(),
    });
  }

  /**
   * Complete the ride
   */
  async completeRide(rideId, actualFare, paymentMethod) {
    const ride = this.activeRides.get(rideId);
    if (!ride) {
      return { success: false, error: 'Corrida não encontrada' };
    }
    
    const completedRide = {
      ...ride,
      status: RideStatus.COMPLETED,
      completedAt: Date.now(),
      actualFare: parseFloat(actualFare),
      paymentMethod,
      duration: Math.floor((Date.now() - ride.startedAt) / 1000 / 60), // minutes
    };
    
    this.activeRides.set(rideId, completedRide);
    
    // Mark driver as available again
    const driver = this.availableDrivers.get(ride.driverId);
    if (driver) {
      driver.isAvailable = true;
      this.availableDrivers.set(ride.driverId, driver);
    }
    
    // Notify both parties
    this.emit(`rideCompleted:${ride.passengerId}`, completedRide);
    this.emit(`rideCompleted:${ride.driverId}`, completedRide);
    
    // Save to history
    await this.saveRideToHistory(completedRide);
    
    return { success: true, ride: completedRide };
  }

  /**
   * Cancel a ride
   */
  async cancelRide(rideId, cancelledBy, reason = '') {
    const ride = this.activeRides.get(rideId) || this.rideRequests.get(rideId);
    if (!ride) {
      return { success: false, error: 'Corrida não encontrada' };
    }
    
    ride.status = RideStatus.CANCELLED;
    ride.cancelledBy = cancelledBy;
    ride.cancelReason = reason;
    ride.cancelledAt = Date.now();
    
    // Remove from active rides
    this.activeRides.delete(rideId);
    this.rideRequests.delete(rideId);
    
    // If driver was assigned, make them available again
    if (ride.driverId) {
      const driver = this.availableDrivers.get(ride.driverId);
      if (driver) {
        driver.isAvailable = true;
        this.availableDrivers.set(ride.driverId, driver);
      }
    }
    
    // Notify parties
    if (ride.passengerId) {
      this.emit(`rideCancelled:${ride.passengerId}`, ride);
    }
    if (ride.driverId) {
      this.emit(`rideCancelled:${ride.driverId}`, ride);
    }
    
    await this.saveRideToHistory(ride);
    
    return { success: true, ride };
  }

  /**
   * Get active ride for a user (passenger or driver)
   */
  async getActiveRide(userId) {
    for (const [rideId, ride] of this.activeRides) {
      if (ride.passengerId === userId || ride.driverId === userId) {
        return ride;
      }
    }
    return null;
  }

  /**
   * Get ride details
   */
  async getRideDetails(rideId) {
    return this.activeRides.get(rideId) || this.rideRequests.get(rideId) || null;
  }

  /**
   * Save ride to storage history
   */
  async saveRideToHistory(ride) {
    try {
      // Save to passenger history
      if (ride.passengerId) {
        const passengerHistory = await StorageService.getTripHistory(ride.passengerId) || [];
        const existingIndex = passengerHistory.findIndex(r => r.id === ride.id);
        if (existingIndex >= 0) {
          passengerHistory[existingIndex] = ride;
        } else {
          passengerHistory.unshift(ride);
        }
        await StorageService.saveTripHistory(ride.passengerId, passengerHistory);
      }
      
      // Save to driver history
      if (ride.driverId) {
        const driverHistory = await StorageService.getTripHistory(ride.driverId) || [];
        const existingIndex = driverHistory.findIndex(r => r.id === ride.id);
        if (existingIndex >= 0) {
          driverHistory[existingIndex] = ride;
        } else {
          driverHistory.unshift(ride);
        }
        await StorageService.saveTripHistory(ride.driverId, driverHistory);
      }
    } catch (error) {
      console.error('Error saving ride to history:', error);
    }
  }

  /**
   * Event system for real-time updates
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      availableDrivers: this.availableDrivers.size,
      activeRides: this.activeRides.size,
      pendingRequests: this.rideRequests.size,
    };
  }
}

export default new RideMatchingService();
