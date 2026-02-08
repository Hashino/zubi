import React, { createContext, useContext, useState, useEffect } from 'react';

// Simulação de rede P2P para MVP
// Em produção, usar libp2p ou similar
const P2PContext = createContext();

export const useP2P = () => useContext(P2PContext);

export const P2PProvider = ({ children }) => {
  const [peers, setPeers] = useState([]);
  const [connectedPeer, setConnectedPeer] = useState(null);
  const [messages, setMessages] = useState([]);

  // Simulação de descoberta de peers (motoristas disponíveis)
  const discoverPeers = (location) => {
    // Em produção, usar Nostr ou DHT para anunciar/descobrir peers
    const mockDrivers = [
      {
        id: 'driver1',
        name: 'João Silva',
        rating: 4.8,
        vehicle: 'Honda Civic Preto',
        plate: 'ABC-1234',
        location: {
          latitude: location.latitude + 0.005,
          longitude: location.longitude + 0.005,
        },
        distance: 0.8,
        xp: 1250,
        level: 'Veterano'
      },
      {
        id: 'driver2',
        name: 'Maria Santos',
        rating: 4.9,
        vehicle: 'Toyota Corolla Prata',
        plate: 'XYZ-5678',
        location: {
          latitude: location.latitude - 0.003,
          longitude: location.longitude + 0.004,
        },
        distance: 1.2,
        xp: 850,
        level: 'Intermediário'
      },
      {
        id: 'driver3',
        name: 'Pedro Costa',
        rating: 4.7,
        vehicle: 'Chevrolet Onix Branco',
        plate: 'DEF-9012',
        location: {
          latitude: location.latitude + 0.002,
          longitude: location.longitude - 0.006,
        },
        distance: 1.5,
        xp: 320,
        level: 'Iniciante'
      }
    ];

    setPeers(mockDrivers);
    return mockDrivers;
  };

  // Conectar com um motorista específico
  const connectToPeer = async (peerId) => {
    const peer = peers.find(p => p.id === peerId);
    if (peer) {
      setConnectedPeer(peer);
      return true;
    }
    return false;
  };

  // Enviar mensagem para peer conectado
  const sendMessage = (message) => {
    if (connectedPeer) {
      setMessages([...messages, { 
        from: 'passenger', 
        to: connectedPeer.id, 
        message,
        timestamp: Date.now()
      }]);
      return true;
    }
    return false;
  };

  // Validação de presença via QR code
  const validatePresence = (qrData) => {
    // Em produção, usar assinaturas criptográficas
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

  // Finalizar viagem e iniciar processo de pagamento
  const finalizeTripPayment = async (tripData) => {
    // Em produção, interagir com smart contract
    const mockTransaction = {
      tripId: tripData.tripId,
      passengerId: 'passenger123',
      driverId: connectedPeer?.id,
      amount: tripData.fare,
      fee: tripData.fare * (connectedPeer?.level === 'Veterano' ? 0.05 : 0.15),
      timestamp: Date.now(),
      signatures: {
        passenger: 'mock_passenger_signature',
        driver: 'mock_driver_signature'
      },
      status: 'pending_blockchain_confirmation'
    };

    // Simular delay de blockchain
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      transaction: mockTransaction,
      blockchainTxHash: '0x' + Math.random().toString(16).substr(2, 64)
    };
  };

  const disconnect = () => {
    setConnectedPeer(null);
    setMessages([]);
  };

  return (
    <P2PContext.Provider value={{
      peers,
      connectedPeer,
      messages,
      discoverPeers,
      connectToPeer,
      sendMessage,
      validatePresence,
      finalizeTripPayment,
      disconnect
    }}>
      {children}
    </P2PContext.Provider>
  );
};
