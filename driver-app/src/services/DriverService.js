/**
 * Driver Service - Driver App
 * 
 * Manages driver profile, online status, trip requests, and earnings.
 * 
 * NOW USES: RideMatchingService for real P2P-style matching
 * - Real ride request notifications
 * - Real driver availability announcement
 * - Integrated with passenger app via shared service
 * 
 * Production TODO:
 * - Replace RideMatchingService in-memory with libp2p/Nostr
 * - Add blockchain integration for payment processing
 * - Implement secure profile storage
 * - Add background location tracking
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import RideMatchingService from '../../../shared/services/RideMatchingService';
import StorageService from '../../../shared/services/StorageService';

const DriverContext = createContext();

export const useDriver = () => useContext(DriverContext);

export const DriverProvider = ({ children }) => {
  const [driverProfile, setDriverProfile] = useState(null);

  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [tripRequests, setTripRequests] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);

  // Load driver profile from storage
  useEffect(() => {
    loadDriverProfile();
  }, []);

  const loadDriverProfile = async () => {
    try {
      const profile = await StorageService.getDriverProfile();
      if (profile && profile.userId) {
        // Transform storage profile to display format
        const displayProfile = {
          id: profile.userId,
          name: profile.name,
          vehicle: `${profile.vehicle?.make || ''} ${profile.vehicle?.model || ''} ${profile.vehicle?.color || ''}`.trim(),
          plate: profile.vehicle?.plate || 'N/A',
          rating: profile.stats?.rating || 5.0,
          xp: profile.governance?.xp || 0,
          level: profile.governance?.level || 'iniciante',
          totalTrips: profile.stats?.totalTrips || 0,
          totalEarnings: profile.stats?.totalEarnings || 0,
        };
        setDriverProfile(displayProfile);
        console.log('[DriverService] Profile loaded:', displayProfile.name);
      } else {
        console.log('[DriverService] No driver profile found in storage');
      }
    } catch (error) {
      console.error('[DriverService] Error loading profile:', error);
    }
  };

  // Announce availability on P2P network
  const goOnline = async (location) => {
    console.log('[DriverService] Going online at:', location);
    
    try {
      setIsOnline(true);
      setCurrentLocation(location);

      // Announce driver availability via RideMatchingService
      const result = await RideMatchingService.announceDriverAvailability(
        driverProfile,
        location
      );

      if (result.success) {
        console.log('[DriverService] Driver announced:', result.driverId);
        
        // Listen for ride requests
        RideMatchingService.on(`rideRequest:${driverProfile.id}`, (rideRequest) => {
          console.log('[DriverService] New ride request:', rideRequest.id);
          setTripRequests(prev => {
            // Avoid duplicates
            if (prev.find(r => r.id === rideRequest.id)) {
              return prev;
            }
            return [...prev, rideRequest];
          });
        });

        // Listen for ride cancellations
        RideMatchingService.on(`rideCancelled:${driverProfile.id}`, (ride) => {
          console.log('[DriverService] Ride cancelled:', ride.id);
          setTripRequests(prev => prev.filter(r => r.id !== ride.id));
          if (activeTrip?.id === ride.id) {
            setActiveTrip(null);
          }
        });

        return true;
      }

      console.error('[DriverService] Failed to announce availability');
      setIsOnline(false);
      return false;
    } catch (error) {
      console.error('[DriverService] Error going online:', error);
      setIsOnline(false);
      return false;
    }
  };

  const goOffline = async () => {
    console.log('[DriverService] Going offline');
    
    try {
      await RideMatchingService.removeDriverAvailability(driverProfile.id);
      setIsOnline(false);
      setTripRequests([]);
      return true;
    } catch (error) {
      console.error('[DriverService] Error going offline:', error);
      return false;
    }
  };

  // Accept trip request
  const acceptTripRequest = async (requestId) => {
    console.log('[DriverService] Accepting ride:', requestId);
    
    try {
      const result = await RideMatchingService.acceptRide(driverProfile.id, requestId);
      
      if (result.success) {
        console.log('[DriverService] Ride accepted:', result.ride.id);
        setActiveTrip(result.ride);
        setTripRequests([]);
        return true;
      }

      console.error('[DriverService] Failed to accept ride:', result.error);
      return false;
    } catch (error) {
      console.error('[DriverService] Error accepting ride:', error);
      return false;
    }
  };

  // Reject trip request
  const rejectTripRequest = async (requestId) => {
    console.log('[DriverService] Rejecting ride:', requestId);
    
    try {
      await RideMatchingService.rejectRide(driverProfile.id, requestId, 'Motorista recusou');
      setTripRequests(prev => prev.filter(r => r.id !== requestId));
      return true;
    } catch (error) {
      console.error('[DriverService] Error rejecting ride:', error);
      return false;
    }
  };

  // Generate QR Code for presence validation
  const generatePresenceQRCode = () => {
    if (activeTrip) {
      return JSON.stringify({
        driverId: driverProfile.id,
        tripId: activeTrip.id,
        timestamp: Date.now()
      });
    }
    return null;
  };

  // Finish trip and process payment
  const finishTrip = async (tripData) => {
    if (!activeTrip) {
      return { success: false, error: 'Nenhuma corrida ativa' };
    }

    console.log('[DriverService] Finishing trip:', activeTrip.id);

    try {
      // Complete ride via RideMatchingService
      const result = await RideMatchingService.completeRide(
        activeTrip.id,
        tripData.fare || activeTrip.estimatedFare,
        tripData.paymentMethod || 'pix'
      );

      if (result.success) {
        const completedRide = result.ride;
        
        // Calculate earnings
        const feePercentage = driverProfile.level === 'Veterano' ? 0.05 : 
                             driverProfile.level === 'Intermediário' ? 0.10 : 0.15;
        const fee = completedRide.actualFare * feePercentage;
        const earning = completedRide.actualFare - fee;

        // Update driver profile
        const updatedProfile = {
          ...driverProfile,
          totalTrips: driverProfile.totalTrips + 1,
          totalEarnings: driverProfile.totalEarnings + earning,
          xp: driverProfile.xp + 10,
        };

        setDriverProfile(updatedProfile);
        await StorageService.saveDriverProfile(updatedProfile);

        setActiveTrip(null);
        
        console.log('[DriverService] Trip completed:', completedRide.id);

        return {
          success: true,
          earning,
          fee,
          newXp: updatedProfile.xp,
          ride: completedRide
        };
      }

      return { success: false, error: 'Falha ao finalizar corrida' };
    } catch (error) {
      console.error('[DriverService] Error finishing trip:', error);
      return { success: false, error: error.message };
    }
  };

  // Update driver location
  const updateLocation = async (location) => {
    setCurrentLocation(location);
    
    if (isOnline) {
      try {
        await RideMatchingService.updateDriverLocation(driverProfile.id, location);
      } catch (error) {
        console.error('[DriverService] Error updating location:', error);
      }
    }
  };

  return (
    <DriverContext.Provider value={{
      driverProfile,
      isOnline,
      currentLocation,
      tripRequests,
      activeTrip,
      goOnline,
      goOffline,
      acceptTripRequest,
      rejectTripRequest,
      generatePresenceQRCode,
      finishTrip,
      setCurrentLocation: updateLocation
    }}>
      {children}
    </DriverContext.Provider>
  );
};
