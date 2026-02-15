import * as NostrTools from 'nostr-tools';
import KeyManagementService from './KeyManagementService';

const { SimplePool, finishEvent, verifySignature, getEventHash, signEvent } = NostrTools;

// Helper function to convert hex string to bytes
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

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

      // Cria evento Nostr usando a API do nostr-tools 1.17.0
      const event = finishEvent({
        kind,
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content,
      }, KeyManagementService.privateKey); // finishEvent aceita hex string diretamente

      console.log('[NostrService] Publishing event to relays:', {
        eventId: event.id,
        kind: event.kind,
        relaysCount: this.relays.length,
      });

      // Publica em todos os relays - pool.publish retorna array de promises
      const publishPromises = this.pool.publish(this.relays, event);
      
      // Aguarda pelo menos um relay aceitar (Promise.any)
      // ou todos falharem (lança AggregateError)
      await Promise.any(publishPromises);

      console.log('[NostrService] Event published successfully:', event.id);
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
    console.log('[NostrService] announceDriver called with:', {
      driverId: driverData.driverId,
      location: driverData.location,
      name: driverData.name,
    });

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

    console.log('[NostrService] Publishing driver event with tags:', JSON.stringify(tags));
    const result = await this.publishEvent(30078, content, tags);
    console.log('[NostrService] announceDriver result:', result);
    return result;
  }

  /**
   * Busca motoristas disponíveis próximos
   */
  async findNearbyDrivers(passengerLocation, radiusKm = 5) {
    try {
      console.log('[NostrService] findNearbyDrivers called:', {
        location: passengerLocation,
        radiusKm,
        poolExists: !!this.pool,
      });

      if (!this.pool) {
        console.log('[NostrService] Pool not initialized, connecting...');
        await this.connect();
      }

      const geohashes = this.getNearbyGeohashes(passengerLocation, radiusKm);
      
      const filters = [{
        kinds: [30078],
        '#t': ['driver-available'],
        limit: 50,
      }];

      console.log('[NostrService] Querying relays with filters:', JSON.stringify(filters));
      console.log('[NostrService] Relays:', this.relays);

      const events = await this.pool.list(this.relays, filters);
      
      console.log(`[NostrService] Received ${events.length} events from relays`);
      
      // Filtra por distância real e verifica eventos
      const drivers = [];
      for (const event of events) {
        console.log('[NostrService] Processing event:', {
          id: event.id,
          kind: event.kind,
          tags: event.tags,
          pubkey: event.pubkey.substring(0, 16) + '...',
        });

        if (!verifySignature(event)) {
          console.warn('[NostrService] Invalid signature for event:', event.id);
          continue;
        }
        
        try {
          const driverData = JSON.parse(event.content);
          const distance = this.calculateDistance(
            passengerLocation,
            driverData.location
          );
          
          console.log('[NostrService] Driver distance:', {
            name: driverData.name,
            distance: distance.toFixed(2) + 'km',
            withinRadius: distance <= radiusKm,
          });
          
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

      console.log(`[NostrService] Found ${drivers.length} nearby drivers within ${radiusKm}km`);
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
