/**
 * P2P Service - Passenger App
 * 
 * Handles peer-to-peer networking for driver discovery and communication.
 * 
 * NOW USES: RideMatchingService for real P2P-style matching
 * - No mock data
 * - Real driver discovery from available drivers
 * - Real ride requests and matching
 * 
 * Production TODO:
 * - Replace RideMatchingService in-memory storage with libp2p/Nostr
 * - Add cryptographic signatures for all communications
 * - Implement blockchain integration for payments
 * - Add offline message queuing
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import RideMatchingService from '../../../shared/services/RideMatchingService';

const P2PContext = createContext();

export const useP2P = () => useContext(P2PContext);

export const P2PProvider = ({ children }) => {
  const [peers, setPeers] = useState([]);
  const [connectedPeer, setConnectedPeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentRide, setCurrentRide] = useState(null);

  // Real P2P discovery using RideMatchingService
  const discoverPeers = async (location) => {
    console.log('[P2PService] Discovering drivers near:', location);
    
    try {
      // Find nearby drivers from the shared RideMatchingService
      const nearbyDrivers = await RideMatchingService.findNearbyDrivers(
        { latitude: location.latitude, longitude: location.longitude },
        10 // Max 10 km radius
      );

      console.log('[P2PService] Found drivers:', nearbyDrivers.length);
      setPeers(nearbyDrivers);
      return nearbyDrivers;
    } catch (error) {
      console.error('[P2PService] Error discovering drivers:', error);
      setPeers([]);
      return [];
    }
  };

  // Request a ride (connects to driver)
  const connectToPeer = async (peerId, origin, destination) => {
    console.log('[P2PService] Requesting ride from driver:', peerId);
    
    const peer = peers.find(p => p.id === peerId);
    if (!peer) {
      console.error('[P2PService] Driver not found');
      return false;
    }

    try {
      // Get passenger profile from storage
      const StorageService = require('../../../shared/services/StorageService').default;
      let passengerProfile = await StorageService.getUserProfile();
      
      if (!passengerProfile) {
        console.error('[P2PService] No passenger profile found');
        return false;
      }

      // Request ride through RideMatchingService
      const result = await RideMatchingService.requestRide(
        passengerProfile,
        origin || {
          latitude: peer.location.latitude,
          longitude: peer.location.longitude,
          address: 'Origem',
        },
        destination || {
          latitude: peer.location.latitude + 0.01,
          longitude: peer.location.longitude + 0.01,
          address: 'Destino',
        }
      );

      if (result.success) {
        console.log('[P2PService] Ride requested:', result.rideId);
        setCurrentRide(result.ride);
        setConnectedPeer(peer);
        
        // Listen for ride acceptance
        RideMatchingService.on(`rideAccepted:${passengerProfile.id}`, (ride) => {
          console.log('[P2PService] Ride accepted by driver!');
          setCurrentRide(ride);
          setConnectedPeer({
            ...peer,
            driverId: ride.driverId,
            driverName: ride.driverName,
          });
        });

        return true;
      }

      console.error('[P2PService] Failed to request ride:', result.error);
      return false;
    } catch (error) {
      console.error('[P2PService] Error requesting ride:', error);
      return false;
    }
  };

  // Send message to connected driver
  const sendMessage = (message) => {
    if (connectedPeer) {
      setMessages([...messages, { 
        from: 'passenger', 
        to: connectedPeer.id, 
        message,
        timestamp: Date.now()
      }]);
      // TODO: Send via P2P network in production
      return true;
    }
    return false;
  };

  // Validate presence via QR code
  const validatePresence = (qrData) => {
    try {
      const data = JSON.parse(qrData);
      if (data.driverId === connectedPeer?.id && data.tripId) {
        return {
          valid: true,
          timestamp: Date.now(),
          driverId: data.driverId,
          tripId: data.tripId
        };
      }
    } catch (e) {
      return { valid: false, error: 'QR Code inválido' };
    }
    return { valid: false, error: 'Driver não corresponde' };
  };

  // Finalize trip and process payment
  const finalizeTripPayment = async (tripData) => {
    if (!currentRide) {
      return { success: false, error: 'Nenhuma corrida ativa' };
    }

    try {
      // Complete ride via RideMatchingService
      const result = await RideMatchingService.completeRide(
        currentRide.id,
        tripData.fare,
        tripData.paymentMethod || 'pix'
      );

      if (result.success) {
        console.log('[P2PService] Trip completed:', result.ride);
        setCurrentRide(null);
        setConnectedPeer(null);
        
        return {
          success: true,
          transaction: {
            tripId: result.ride.id,
            amount: result.ride.actualFare,
            timestamp: result.ride.completedAt,
          },
        };
      }

      return { success: false, error: 'Falha ao finalizar corrida' };
    } catch (error) {
      console.error('[P2PService] Error finalizing trip:', error);
      return { success: false, error: error.message };
    }
  };

  // Cancel current ride
  const cancelRide = async (reason) => {
    if (!currentRide) {
      return { success: false, error: 'Nenhuma corrida ativa' };
    }

    try {
      const result = await RideMatchingService.cancelRide(
        currentRide.id,
        'passenger',
        reason
      );

      if (result.success) {
        setCurrentRide(null);
        setConnectedPeer(null);
        return { success: true };
      }

      return { success: false, error: 'Falha ao cancelar corrida' };
    } catch (error) {
      console.error('[P2PService] Error canceling ride:', error);
      return { success: false, error: error.message };
    }
  };

  const disconnect = () => {
    setConnectedPeer(null);
    setMessages([]);
    setCurrentRide(null);
  };

  return (
    <P2PContext.Provider value={{
      peers,
      connectedPeer,
      messages,
      currentRide,
      discoverPeers,
      connectToPeer,
      sendMessage,
      validatePresence,
      finalizeTripPayment,
      cancelRide,
      disconnect
    }}>
      {children}
    </P2PContext.Provider>
  );
};
