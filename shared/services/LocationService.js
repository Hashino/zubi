/**
 * LocationService - Real-time location tracking
 * 
 * Handles GPS tracking for both passenger and driver apps
 */

import * as Location from 'expo-location';

class LocationService {
  constructor() {
    this.currentLocation = null;
    this.watchId = null;
    this.listeners = [];
  }

  /**
   * Request location permissions
   */
  async requestPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Permissão de localização negada');
      }
      
      // For drivers, also request background location
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      return {
        foreground: status === 'granted',
        background: backgroundStatus === 'granted',
      };
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      throw error;
    }
  }

  /**
   * Get current location once
   */
  async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
      
      return this.currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }

  /**
   * Start watching location changes (real-time tracking)
   */
  async startWatching(callback, options = {}) {
    try {
      // Stop any existing watch
      await this.stopWatching();
      
      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: options.interval || 5000, // Update every 5 seconds
          distanceInterval: options.distanceFilter || 10, // or every 10 meters
        },
        (location) => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            speed: location.coords.speed,
            heading: location.coords.heading,
            timestamp: location.timestamp,
          };
          
          // Notify callback
          if (callback) {
            callback(this.currentLocation);
          }
          
          // Notify all listeners
          this.notifyListeners(this.currentLocation);
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error starting location watch:', error);
      throw error;
    }
  }

  /**
   * Stop watching location changes
   */
  async stopWatching() {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
  }

  /**
   * Geocode address to coordinates
   */
  async geocodeAddress(address) {
    try {
      const results = await Location.geocodeAsync(address);
      
      if (results && results.length > 0) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
          address,
        };
      }
      
      throw new Error('Endereço não encontrado');
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(latitude, longitude) {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (results && results.length > 0) {
        const location = results[0];
        const address = [
          location.name,
          location.street,
          location.streetNumber,
          location.district,
          location.city,
          location.region,
        ]
          .filter(Boolean)
          .join(', ');
        
        return {
          address,
          city: location.city,
          region: location.region,
          country: location.country,
          postalCode: location.postalCode,
        };
      }
      
      return { address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return { address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` };
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance; // in kilometers
  }

  /**
   * Get current location or cached location
   */
  getLocation() {
    return this.currentLocation;
  }

  /**
   * Add listener for location updates
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of location update
   */
  notifyListeners(location) {
    this.listeners.forEach(callback => {
      try {
        callback(location);
      } catch (error) {
        console.error('Error in location listener:', error);
      }
    });
  }

  /**
   * Check if location services are enabled
   */
  async isLocationEnabled() {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      return false;
    }
  }
}

export default new LocationService();
