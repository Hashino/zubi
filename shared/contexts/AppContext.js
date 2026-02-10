/**
 * AppContext - Global state management for Zubi
 * Manages ride state, location, and user session
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import RideMatchingService from '../services/RideMatchingService';
import LocationService from '../services/LocationService';
import AuthService from '../services/AuthService';
import StorageService from '../services/StorageService';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children, userType }) => {
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Load user session
      const session = await AuthService.getSession();
      if (session) {
        setUser(session.user);
      }

      // Request location permissions
      const permissions = await LocationService.requestPermissions();
      if (permissions.foreground) {
        const currentLocation = await LocationService.getCurrentLocation();
        setLocation(currentLocation);
        
        // Start watching location
        await LocationService.startWatching((newLocation) => {
          setLocation(newLocation);
        });
      }

      // Check for active ride
      if (session?.user?.id) {
        const ride = await RideMatchingService.getActiveRide(session.user.id);
        if (ride) {
          setActiveRide(ride);
        }
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    const result = await AuthService.login(credentials);
    if (result.success) {
      setUser(result.user);
      return result;
    }
    throw new Error(result.error || 'Login failed');
  };

  const logout = async () => {
    await AuthService.logout();
    await LocationService.stopWatching();
    setUser(null);
    setActiveRide(null);
  };

  const requestRide = async (origin, destination) => {
    if (!user || !location) {
      throw new Error('User not logged in or location not available');
    }

    const result = await RideMatchingService.requestRide(
      user,
      origin || location,
      destination
    );

    if (result.success) {
      // Listen for ride acceptance
      RideMatchingService.on(`rideAccepted:${user.id}`, (ride) => {
        setActiveRide(ride);
      });

      return result;
    }

    throw new Error(result.error || 'Failed to request ride');
  };

  const cancelRide = async () => {
    if (!activeRide) return;

    await RideMatchingService.cancelRide(
      activeRide.id,
      user.id,
      'Cancelled by user'
    );
    
    setActiveRide(null);
  };

  const completeRide = async (paymentMethod) => {
    if (!activeRide) return;

    const result = await RideMatchingService.completeRide(
      activeRide.id,
      activeRide.estimatedFare,
      paymentMethod
    );

    if (result.success) {
      setActiveRide(null);
      return result.ride;
    }

    throw new Error('Failed to complete ride');
  };

  const value = {
    // State
    user,
    location,
    activeRide,
    isLoading,
    userType,

    // Actions
    login,
    logout,
    requestRide,
    cancelRide,
    completeRide,
    setActiveRide,
    
    // Services (for direct access if needed)
    rideService: RideMatchingService,
    locationService: LocationService,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
