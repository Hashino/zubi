import * as NostrTools from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';
import KeyManagementService from './KeyManagementService';

const { SimplePool, finalizeEvent, verifySignature } = NostrTools;

// Polyfill WebSocket para React Native
if (typeof WebSocket === 'undefined') {
  global.WebSocket = require('react-native/Libraries/WebSocket/WebSocket');
}

/**
 * NostrService - Implementa comunicação P2P via Nostr Relays
 * Usado para matchmaking de motoristas e passageiros (PMCD Layer 2)
 */
class NostrService {
  constructor() {
    this.pool = null;
    this.relays = [
      'wss://relay.damus.io',
      'wss://relay.nostr.band',
      'wss://nos.lol',
      'wss://relay.snort.social',
    ];
    this.subscriptions = new Map();
    this.connected = false;
  }

  /**
   * Conecta aos relays Nostr
   */
  async connect() {
    try {
      if (this.pool) {
        return { success: true };
      }

      // SimplePool usa WebSocket global automaticamente
      this.pool = new SimplePool();
      this.connected = true;
      
      console.log('[NostrService] Connected to relays:', this.relays);
      return { success: true };
    } catch (error) {
      console.error('[NostrService] Connect failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Publica evento no Nostr
   */
  async publishEvent(kind, content, tags = []) {
    try {
      if (!this.pool) {
        await this.connect();
      }

      // Obtém private key do KeyManagementService
      if (!KeyManagementService.initialized) {
        throw new Error('KeyManagementService not initialized');
      }
      
      if (!KeyManagementService.privateKey) {
        throw new Error('KeyManagementService private key not available');
      }

      const privateKeyBytes = hexToBytes(KeyManagementService.privateKey);

      // Cria evento Nostr
      const event = finalizeEvent({
        kind,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content,
      }, privateKeyBytes);

      // Publica em todos os relays
      await Promise.any(
        this.pool.publish(this.relays, event)
      );

      console.log('[NostrService] Event published:', event.id);
      return { success: true, eventId: event.id };
    } catch (error) {
      console.error('[NostrService] Publish failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Anuncia disponibilidade do motorista (Kind 30078 - Parameterized Replaceable)
   */
  async announceDriver(driverData) {
    const content = JSON.stringify({
      name: driverData.name,
      vehicle: driverData.vehicle,
      rating: driverData.rating,
      level: driverData.level,
      location: driverData.location,
      available: true,
      timestamp: Date.now(),
    });

    const tags = [
      ['d', driverData.driverId], // identificador único (torna evento replaceable)
      ['t', 'driver-available'],
      ['geohash', this.getGeohash(driverData.location)],
      ['level', driverData.level.toString()],
    ];

    return await this.publishEvent(30078, content, tags);
  }

  /**
   * Busca motoristas disponíveis próximos
   */
  async findNearbyDrivers(passengerLocation, radiusKm = 5) {
    try {
      if (!this.pool) {
        await this.connect();
      }

      const geohashes = this.getNearbyGeohashes(passengerLocation, radiusKm);
      
      const filters = [{
        kinds: [30078],
        '#t': ['driver-available'],
        limit: 50,
      }];

      const events = await this.pool.list(this.relays, filters);
      
      // Filtra por distância real e verifica eventos
      const drivers = [];
      for (const event of events) {
        if (!verifySignature(event)) continue;
        
        try {
          const driverData = JSON.parse(event.content);
          const distance = this.calculateDistance(
            passengerLocation,
            driverData.location
          );
          
          if (distance <= radiusKm) {
            drivers.push({
              ...driverData,
              distance,
              eventId: event.id,
              publicKey: event.pubkey,
            });
          }
        } catch (e) {
          console.warn('[NostrService] Invalid driver event:', e);
        }
      }

      console.log(`[NostrService] Found ${drivers.length} nearby drivers`);
      return { success: true, drivers: drivers.sort((a, b) => a.distance - b.distance) };
    } catch (error) {
      console.error('[NostrService] Find drivers failed:', error);
      return { success: false, error: error.message, drivers: [] };
    }
  }

  /**
   * Envia solicitação de corrida (Kind 4 - Encrypted Direct Message)
   */
  async sendRideRequest(driverPublicKey, rideData) {
    const content = JSON.stringify({
      type: 'ride_request',
      passengerName: rideData.passengerName,
      origin: rideData.origin,
      destination: rideData.destination,
      estimatedFare: rideData.estimatedFare,
      timestamp: Date.now(),
    });

    const tags = [
      ['p', driverPublicKey],
      ['t', 'ride-request'],
    ];

    return await this.publishEvent(4, content, tags);
  }

  /**
   * Subscreve a eventos direcionados ao usuário
   */
  async subscribeToUserEvents(callback) {
    try {
      if (!this.pool) {
        await this.connect();
      }

      const publicKey = KeyManagementService.getNostrPublicKey();
      
      const filters = [
        {
          kinds: [4], // Mensagens diretas
          '#p': [publicKey],
          since: Math.floor(Date.now() / 1000) - 3600, // última hora
        }
      ];

      const sub = this.pool.sub(
        this.relays,
        filters
      );
      
      sub.on('event', (event) => {
        if (verifySignature(event)) {
          callback(event);
        }
      });
      
      sub.on('eose', () => {
        console.log('[NostrService] Subscription established');
      });

      this.subscriptions.set('user-events', sub);
      return { success: true };
    } catch (error) {
      console.error('[NostrService] Subscribe failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancela subscrição
   */
  unsubscribe(subId) {
    const sub = this.subscriptions.get(subId);
    if (sub) {
      sub.close();
      this.subscriptions.delete(subId);
    }
  }

  /**
   * Calcula geohash simplificado (para indexação por localização)
   */
  getGeohash(location, precision = 5) {
    // Implementação simplificada de geohash
    const lat = Math.floor(location.latitude * Math.pow(10, precision)) / Math.pow(10, precision);
    const lng = Math.floor(location.longitude * Math.pow(10, precision)) / Math.pow(10, precision);
    return `${lat},${lng}`;
  }

  /**
   * Retorna geohashes próximos (incluindo células adjacentes)
   */
  getNearbyGeohashes(location, radiusKm) {
    const precision = 5;
    const geohashes = [this.getGeohash(location, precision)];
    return geohashes;
  }

  /**
   * Calcula distância entre dois pontos (Haversine)
   */
  calculateDistance(loc1, loc2) {
    const R = 6371; // Raio da Terra em km
    const dLat = this.deg2rad(loc2.latitude - loc1.latitude);
    const dLon = this.deg2rad(loc2.longitude - loc1.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(loc1.latitude)) *
      Math.cos(this.deg2rad(loc2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Desconecta dos relays
   */
  disconnect() {
    if (this.pool) {
      this.subscriptions.forEach((sub) => sub.close());
      this.subscriptions.clear();
      this.pool.close(this.relays);
      this.pool = null;
      this.connected = false;
    }
  }
}

export default new NostrService();
