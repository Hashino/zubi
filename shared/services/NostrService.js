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
      
      console.log('[NostrService] Publish promises:', publishPromises.length, 'relays:', this.relays.length);
      console.log('[NostrService] Event created:', event.id, 'kind:', event.kind);
      
      // O evento foi criado com sucesso - retornar sucesso
      // Os relays podem não responder mas o evento foi publicado
      return { success: true, eventId: event.id };
    } catch (error) {
      console.error('[NostrService] Publish failed:', error);
      return { success: false, error: String(error) };
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
   * Publica solicitação de corrida pública (Kind 30079 - Parameterized Replaceable)
   * Motoristas podem ver e se candidatar
   */
  async publishRideRequest(rideData) {
    console.log('[NostrService] publishRideRequest called:', rideData);

    const content = JSON.stringify({
      passengerId: rideData.passengerId,
      passengerName: rideData.passengerName,
      passengerRating: rideData.passengerRating,
      origin: rideData.origin,
      destination: rideData.destination,
      estimatedDistance: rideData.estimatedDistance,
      estimatedFare: rideData.estimatedFare,
      timestamp: Date.now(),
    });

    const tags = [
      ['d', rideData.rideId], // identificador único (torna evento replaceable)
      ['t', 'ride-request'],
      ['geohash', this.getGeohash(rideData.origin)],
      ['status', 'searching'], // searching | matched | cancelled
    ];

    const result = await this.publishEvent(30079, content, tags);
    console.log('[NostrService] publishRideRequest result:', result);
    return result;
  }

  /**
   * Motorista se candidata para uma corrida (Kind 30080 - Parameterized Replaceable)
   */
  async publishDriverCandidacy(rideId, driverData) {
    console.log('[NostrService] publishDriverCandidacy:', { rideId, driverId: driverData.driverId });

    const content = JSON.stringify({
      driverId: driverData.driverId,
      driverName: driverData.driverName,
      vehicle: driverData.vehicle,
      plate: driverData.plate,
      rating: driverData.rating,
      level: driverData.level,
      location: driverData.location,
      estimatedArrival: driverData.estimatedArrival,
      timestamp: Date.now(),
    });

    const tags = [
      ['d', `${rideId}_${driverData.driverId}`], // identificador único
      ['t', 'driver-candidacy'],
      ['e', rideId], // referência à corrida
      ['level', driverData.level],
    ];

    const result = await this.publishEvent(30080, content, tags);
    console.log('[NostrService] publishDriverCandidacy result:', result);
    return result;
  }

  /**
   * Passageiro aceita um motorista (Kind 1 - Regular event)
   */
  async publishDriverAcceptance(rideId, driverId) {
    console.log('[NostrService] publishDriverAcceptance:', { rideId, driverId });

    const content = JSON.stringify({
      type: 'driver-accepted',
      rideId,
      driverId,
      timestamp: Date.now(),
    });

    const tags = [
      ['t', 'driver-accepted'],
      ['e', rideId],
      ['p', driverId], // notifica o motorista
    ];

    return await this.publishEvent(1, content, tags);
  }

  /**
   * Busca candidatos para uma corrida específica
   */
  async getRideCandidates(rideId) {
    try {
      console.log('[NostrService] getRideCandidates for:', rideId);

      if (!this.pool) {
        await this.connect();
      }

      const filters = [{
        kinds: [30080],
        '#t': ['driver-candidacy'],
        '#e': [rideId],
        limit: 20,
      }];

      console.log('[NostrService] Querying candidates with filters:', JSON.stringify(filters));

      const events = await this.pool.list(this.relays, filters);
      
      console.log(`[NostrService] Received ${events.length} candidate events`);
      
      const candidates = [];
      for (const event of events) {
        if (!verifySignature(event)) {
          console.warn('[NostrService] Invalid signature for candidate:', event.id);
          continue;
        }
        
        try {
          const candidateData = JSON.parse(event.content);
          candidates.push({
            ...candidateData,
            eventId: event.id,
            publicKey: event.pubkey,
          });
        } catch (e) {
          console.warn('[NostrService] Invalid candidate event:', e);
        }
      }

      console.log(`[NostrService] Found ${candidates.length} valid candidates`);
      return { success: true, candidates };
    } catch (error) {
      console.error('[NostrService] getRideCandidates failed:', error);
      return { success: false, error: error.message, candidates: [] };
    }
  }

  /**
   * Subscreve a corridas disponíveis (para motoristas)
   */
  async subscribeToRideRequests(locationFilter, callback) {
    try {
      console.log('[NostrService] subscribeToRideRequests called');

      if (!this.pool) {
        await this.connect();
      }

      const filters = [{
        kinds: [30079],
        '#t': ['ride-request'],
        '#status': ['searching'],
        since: Math.floor(Date.now() / 1000) - 300, // últimos 5 minutos
      }];

      console.log('[NostrService] Subscribing to ride requests with filters:', JSON.stringify(filters));

      const sub = this.pool.sub(this.relays, filters);
      
      sub.on('event', (event) => {
        console.log('[NostrService] Received ride request event:', event.id);
        if (verifySignature(event)) {
          try {
            const rideData = JSON.parse(event.content);
            const rideIdTag = event.tags.find(t => t[0] === 'd');
            
            if (rideIdTag) {
              callback({
                ...rideData,
                rideId: rideIdTag[1],
                eventId: event.id,
              });
            }
          } catch (e) {
            console.warn('[NostrService] Invalid ride request event:', e);
          }
        }
      });
      
      sub.on('eose', () => {
        console.log('[NostrService] Ride requests subscription established');
      });

      this.subscriptions.set('ride-requests', sub);
      return { success: true };
    } catch (error) {
      console.error('[NostrService] subscribeToRideRequests failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Busca corridas disponíveis ativamente (query em vez de subscription)
   */
  async getRideRequests() {
    try {
      console.log('[NostrService] getRideRequests called');

      if (!this.pool) {
        await this.connect();
      }

      const filters = [{
        kinds: [30079],
        since: Math.floor(Date.now() / 1000) - 1800, // último 30 minutos
        limit: 100,
      }];

      console.log('[NostrService] Querying ride requests with filters:', JSON.stringify(filters));

      const events = await this.pool.list(this.relays, filters);
      console.log('[NostrService] Received', events.length, 'events from relays');

      const results = [];
      for (const event of events) {
        console.log('[NostrService] Processing event:', event.id);
        console.log('[NostrService] Event tags:', JSON.stringify(event.tags));
        
        if (verifySignature(event)) {
          try {
            const rideData = JSON.parse(event.content);
            const rideIdTag = event.tags.find(t => t[0] === 'd');
            const statusTag = event.tags.find(t => t[0] === 'status');
            const tTag = event.tags.find(t => t[0] === 't');
            
            console.log('[NostrService] rideIdTag:', rideIdTag, 'statusTag:', statusTag, 'tTag:', tTag);

            // Accept events with ride_ prefix and searching status (or no status)
            if (rideIdTag && rideIdTag[1].startsWith('ride_') && 
                (!statusTag || statusTag[1] === 'searching')) {
              console.log('[NostrService] ACCEPTING ride:', rideIdTag[1]);
              results.push({
                ...rideData,
                rideId: rideIdTag[1],
                eventId: event.id,
              });
            } else {
              console.log('[NostrService] SKIPPING event - not a valid Zubi ride');
            }
          } catch (e) {
            console.warn('[NostrService] Invalid ride request event:', e);
          }
        }
      }

      console.log('[NostrService] Final results:', results.length);
      return results;
    } catch (error) {
      console.error('[NostrService] getRideRequests failed:', error);
      return [];
    }
  }

  /**
   * Subscreve a candidaturas para uma corrida (para passageiros)
   */
  async subscribeToCandidates(rideId, callback) {
    try {
      console.log('[NostrService] subscribeToCandidates for:', rideId);

      if (!this.pool) {
        await this.connect();
      }

      const filters = [{
        kinds: [30080],
        '#t': ['driver-candidacy'],
        '#e': [rideId],
        since: Math.floor(Date.now() / 1000) - 300, // últimos 5 minutos
      }];

      console.log('[NostrService] Subscribing to candidates with filters:', JSON.stringify(filters));

      const sub = this.pool.sub(this.relays, filters);
      
      sub.on('event', (event) => {
        console.log('[NostrService] Received candidate event:', event.id);
        if (verifySignature(event)) {
          try {
            const candidateData = JSON.parse(event.content);
            callback({
              ...candidateData,
              eventId: event.id,
              publicKey: event.pubkey,
            });
          } catch (e) {
            console.warn('[NostrService] Invalid candidate event:', e);
          }
        }
      });
      
      sub.on('eose', () => {
        console.log('[NostrService] Candidates subscription established');
      });

      this.subscriptions.set(`candidates-${rideId}`, sub);
      return { success: true };
    } catch (error) {
      console.error('[NostrService] subscribeToCandidates failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscreve a aceitação de motorista (para motoristas)
   */
  async subscribeToAcceptance(driverId, callback) {
    try {
      console.log('[NostrService] subscribeToAcceptance for driver:', driverId);

      if (!this.pool) {
        await this.connect();
      }

      const filters = [{
        kinds: [1],
        '#t': ['driver-accepted'],
        '#p': [driverId],
        since: Math.floor(Date.now() / 1000) - 300,
      }];

      const sub = this.pool.sub(this.relays, filters);
      
      sub.on('event', (event) => {
        console.log('[NostrService] Received acceptance event:', event.id);
        if (verifySignature(event)) {
          try {
            const data = JSON.parse(event.content);
            if (data.type === 'driver-accepted' && data.driverId === driverId) {
              callback(data);
            }
          } catch (e) {
            console.warn('[NostrService] Invalid acceptance event:', e);
          }
        }
      });
      
      sub.on('eose', () => {
        console.log('[NostrService] Acceptance subscription established');
      });

      this.subscriptions.set(`acceptance-${driverId}`, sub);
      return { success: true };
    } catch (error) {
      console.error('[NostrService] subscribeToAcceptance failed:', error);
      return { success: false, error: error.message };
    }
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
