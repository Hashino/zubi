import React, { createContext, useContext, useState } from 'react';

const DriverContext = createContext();

export const useDriver = () => useContext(DriverContext);

export const DriverProvider = ({ children }) => {
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

  // Anunciar disponibilidade na rede P2P
  const goOnline = (location) => {
    setIsOnline(true);
    setCurrentLocation(location);
    // Em produção, anunciar via Nostr ou DHT
    startReceivingRequests();
  };

  const goOffline = () => {
    setIsOnline(false);
    setTripRequests([]);
  };

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

  // Rejeitar solicitação
  const rejectTripRequest = (requestId) => {
    setTripRequests(prev => prev.filter(r => r.id !== requestId));
  };

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
