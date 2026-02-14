/**
 * AppContext - Global state management for Zubi
 * Manages ride state, location, and user session
 * 
 * SAFEGUARDS:
 * - Non-blocking initialization (UI renders immediately)
 * - Timeouts on all async operations (prevents infinite hangs)
 * - Error boundaries on all service calls
 * - Graceful degradation (app works even if services fail)
 * - Cleanup on unmount (prevents memory leaks)
 * - Detailed logging for debugging
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import RideMatchingService from '../services/RideMatchingService';
import LocationService from '../services/LocationService';
import AuthService from '../services/AuthService';
import StorageService from '../services/StorageService';
import KeyManagementService from '../services/KeyManagementService';

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

  // Initialize app - NON-BLOCKING, safe initialization with timeouts and safeguards
  useEffect(() => {
    let mounted = true;
    let locationWatchId = null;
    
    // Helper: Promise with timeout
    const withTimeout = (promise, timeoutMs, operationName) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`${operationName} timeout after ${timeoutMs}ms`)), timeoutMs)
        )
      ]);
    };
    
    // Helper: Safe promise execution with error boundary
    const safeExecute = async (fn, operationName, timeoutMs = 10000) => {
      try {
        const result = await withTimeout(fn(), timeoutMs, operationName);
        return { success: true, data: result };
      } catch (error) {
        console.log(`[AppContext] ${operationName} failed:`, error.message);
        return { success: false, error };
      }
    };
    
    const initializeApp = async () => {
      console.log('[AppContext] Starting initialization...');
      
      // CRITICAL: Set loading to false immediately to prevent render blocking
      setIsLoading(false);
      
      // Phase 1: Load user session (timeout: 5s)
      const sessionResult = await safeExecute(
        () => AuthService.getSession(),
        'Load session',
        5000
      );
      
      if (mounted && sessionResult.success && sessionResult.data?.user) {
        console.log('[AppContext] Session loaded successfully');
        setUser(sessionResult.data.user);
        
        // CRITICAL: Initialize KeyManagementService for Nostr functionality
        const keyResult = await safeExecute(
          () => KeyManagementService.initialize(sessionResult.data.user.id),
          'Initialize KeyManagement',
          5000
        );
        
        if (keyResult.success) {
          console.log('[AppContext] KeyManagementService initialized successfully');
        } else {
          console.error('[AppContext] Failed to initialize KeyManagementService:', keyResult.error);
          // Continue anyway - app can work with limited functionality
        }
        
        // Phase 2: Check for active ride (timeout: 3s)
        const rideResult = await safeExecute(
          () => RideMatchingService.getActiveRide(sessionResult.data.user.id),
          'Check active ride',
          3000
        );
        
        if (mounted && rideResult.success && rideResult.data) {
          console.log('[AppContext] Active ride found');
          setActiveRide(rideResult.data);
        }
      }
      
      // Phase 3: Request location permissions (timeout: 10s, can take longer on first run)
      const permissionResult = await safeExecute(
        () => LocationService.requestPermissions(),
        'Request location permissions',
        10000
      );
      
      if (!mounted) return;
      
      if (permissionResult.success && permissionResult.data?.foreground) {
        console.log('[AppContext] Location permissions granted');
        
        // Phase 4: Get current location (timeout: 8s)
        const locationResult = await safeExecute(
          () => LocationService.getCurrentLocation(),
          'Get current location',
          8000
        );
        
        if (mounted && locationResult.success && locationResult.data) {
          console.log('[AppContext] Location obtained');
          setLocation(locationResult.data);
        }
        
        // Phase 5: Start watching location (non-critical, runs in background)
        if (mounted) {
          safeExecute(
            () => LocationService.startWatching((newLocation) => {
              if (mounted) {
                console.log('[AppContext] Location updated');
                setLocation(newLocation);
              }
            }),
            'Start location watching',
            5000
          ).then(result => {
            if (result.success) {
              locationWatchId = result.data;
            }
          });
        }
      } else {
        console.log('[AppContext] Location permissions not granted, app will work with limited functionality');
      }
      
      console.log('[AppContext] Initialization complete');
    };
    
    // Run initialization with global error boundary
    initializeApp().catch(error => {
      console.error('[AppContext] Critical initialization error:', error);
      // App continues to work even if initialization fails
    });
    
    // Cleanup on unmount
    return () => {
      console.log('[AppContext] Cleaning up...');
      mounted = false;
      
      // Safe cleanup
      if (locationWatchId) {
        LocationService.stopWatching().catch(err => {
          console.log('[AppContext] Cleanup warning:', err.message);
        });
      }
    };
  }, []);

  const login = async (credentials) => {
    try {
      const result = await AuthService.login(credentials);
      if (result.success) {
        setUser(result.user);
        console.log('[AppContext] Login successful');
        
        // Initialize KeyManagementService for this user
        try {
          await KeyManagementService.initialize(result.user.id);
          console.log('[AppContext] KeyManagementService initialized after login');
        } catch (keyError) {
          console.error('[AppContext] Failed to initialize KeyManagementService after login:', keyError);
          // Continue anyway - app can work with limited functionality
        }
        
        return result;
      }
      throw new Error(result.error || 'Login failed');
    } catch (error) {
      console.error('[AppContext] Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      await LocationService.stopWatching().catch(() => {
        // Ignore stopWatching errors during logout
      });
      setUser(null);
      setActiveRide(null);
      console.log('[AppContext] Logout successful');
    } catch (error) {
      console.error('[AppContext] Logout error:', error);
      // Still clear state even if logout fails
      setUser(null);
      setActiveRide(null);
    }
  };

  const requestRide = async (origin, destination) => {
    try {
      if (!user) {
        throw new Error('User not logged in');
      }
      
      // Allow request even without location (use origin parameter)
      if (!location && !origin) {
        throw new Error('Location not available. Please enable location permissions.');
      }

      const result = await RideMatchingService.requestRide(
        user,
        origin || location,
        destination
      );

      if (result.success) {
        console.log('[AppContext] Ride requested successfully');
        
        // Listen for ride acceptance
        RideMatchingService.on(`rideAccepted:${user.id}`, (ride) => {
          console.log('[AppContext] Ride accepted');
          setActiveRide(ride);
        });

        return result;
      }

      throw new Error(result.error || 'Failed to request ride');
    } catch (error) {
      console.error('[AppContext] Request ride error:', error);
      throw error;
    }
  };

  const cancelRide = async () => {
    try {
      if (!activeRide) {
        console.log('[AppContext] No active ride to cancel');
        return;
      }

      await RideMatchingService.cancelRide(
        activeRide.id,
        user.id,
        'Cancelled by user'
      );
      
      setActiveRide(null);
      console.log('[AppContext] Ride cancelled successfully');
    } catch (error) {
      console.error('[AppContext] Cancel ride error:', error);
      // Still clear active ride even if cancel fails
      setActiveRide(null);
      throw error;
    }
  };

  const completeRide = async (paymentMethod) => {
    try {
      if (!activeRide) {
        throw new Error('No active ride to complete');
      }

      const result = await RideMatchingService.completeRide(
        activeRide.id,
        activeRide.estimatedFare,
        paymentMethod
      );

      if (result.success) {
        setActiveRide(null);
        console.log('[AppContext] Ride completed successfully');
        return result.ride;
      }

      throw new Error('Failed to complete ride');
    } catch (error) {
      console.error('[AppContext] Complete ride error:', error);
      throw error;
    }
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
