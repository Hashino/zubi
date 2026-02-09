/**
 * Driver Service - Driver App
 * 
 * Manages driver profile, online status, trip requests, and earnings.
 * 
 * Current Status: MVP - Mock implementation
 * Production TODO:
 * - Integrate with real P2P network for trip requests
 * - Add blockchain integration for payment processing
 * - Implement secure profile storage
 * - Add background location tracking
 * - Implement proper state persistence
 * 
 * Security Warnings:
 * - Profile data is hardcoded
 * - No cryptographic signatures on QR codes
 * - No blockchain integration
 * - XP calculations are client-side only
 */

import React, { createContext, useContext, useState } from 'react';

const DriverContext = createContext();

export const useDriver = () => useContext(DriverContext);

export const DriverProvider = ({ children }) => {
  // warn: Hardcoded driver profile - should load from secure storage
  // TODO: Implement profile persistence with encrypted storage
  // FIX: Add profile validation and error handling
  const [driverProfile, setDriverProfile] = useState({
    id: 'driver1',
    name: 'João Silva',
    vehicle: 'Honda Civic Preto',
    plate: 'ABC-1234',
    rating: 4.8,
    xp: 1250,
    level: 'Veterano',
    totalTrips: 427,
    totalEarnings: 12450.50
  });

  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [tripRequests, setTripRequests] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);

  // warn: No real P2P announcement - simulated only
  // TODO: Announce availability via Nostr relays or libp2p DHT
  // FIX: Add periodic heartbeat to keep connection alive
  // Anunciar disponibilidade na rede P2P
  const goOnline = (location) => {
    setIsOnline(true);
    setCurrentLocation(location);
    // Em produção, anunciar via Nostr ou DHT
    startReceivingRequests();
  };

  const goOffline = () => {
    // TODO: Send disconnect message to P2P network
    // FIX: Reject pending trip requests before going offline
    setIsOnline(false);
    setTripRequests([]);
  };

  // warn: Mock trip requests - not real P2P messages
  // TODO: Listen for trip requests on P2P network
  // bug: Fixed 5-second delay - should be event-driven
  // FIX: Implement proper message queue and notification system
  // Simular recebimento de solicitações
  const startReceivingRequests = () => {
    // Simular chegada de solicitação após alguns segundos
    setTimeout(() => {
      if (isOnline) {
        const mockRequest = {
          id: 'req_' + Date.now(),
          passengerId: 'passenger123',
          passengerName: 'Maria Santos',
          passengerRating: 4.9,
          origin: {
            latitude: currentLocation?.latitude || 0,
            longitude: currentLocation?.longitude || 0,
            address: 'Rua das Flores, 123'
          },
          destination: {
            address: 'Av. Principal, 456'
          },
          estimatedFare: (Math.random() * 20 + 10).toFixed(2),
          timestamp: Date.now()
        };
        setTripRequests(prev => [...prev, mockRequest]);
      }
    }, 5000);
  };

  // TODO: Send accept message to passenger via P2P
  // FIX: Add timeout for passenger confirmation
  // Aceitar solicitação de viagem
  const acceptTripRequest = (requestId) => {
    const request = tripRequests.find(r => r.id === requestId);
    if (request) {
      setActiveTrip({
        ...request,
        tripId: 'trip_' + Date.now(),
        status: 'accepted',
        driver: driverProfile
      });
      setTripRequests([]);
      return true;
    }
    return false;
  };

  // TODO: Send rejection message to passenger
  // Rejeitar solicitação
  const rejectTripRequest = (requestId) => {
    setTripRequests(prev => prev.filter(r => r.id !== requestId));
  };

  // warn: No cryptographic signature - QR is easily forgeable
  // TODO: Sign QR data with driver's private key
  // FIX: Add nonce and expiration timestamp
  // Gerar QR Code para validação de presença
  const generatePresenceQRCode = () => {
    if (activeTrip) {
      return JSON.stringify({
        driverId: driverProfile.id,
        tripId: activeTrip.tripId,
        timestamp: Date.now()
      });
    }
    return null;
  };

  // warn: No blockchain integration - simulated payment
  // TODO: Call smart contract to process payment
  // bug: XP level thresholds are hardcoded - should be on-chain
  // FIX: Add transaction confirmation waiting
  // Finalizar viagem
  const finishTrip = async (tripData) => {
    // Em produção, assinar transação e enviar para blockchain
    const fee = parseFloat(tripData.fare) * (driverProfile.level === 'Veterano' ? 0.05 : driverProfile.level === 'Intermediário' ? 0.10 : 0.15);
    const earning = parseFloat(tripData.fare) - fee;

    // Atualizar perfil do motorista
    setDriverProfile(prev => ({
      ...prev,
      totalTrips: prev.totalTrips + 1,
      totalEarnings: prev.totalEarnings + earning,
      xp: prev.xp + 10 // Ganhar 10 XP por viagem
    }));

    setActiveTrip(null);
    
    return {
      success: true,
      earning,
      fee,
      newXp: driverProfile.xp + 10
    };
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
      setCurrentLocation
    }}>
      {children}
    </DriverContext.Provider>
  );
};
