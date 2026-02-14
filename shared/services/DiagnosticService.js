/**
 * DiagnosticService - Diagnóstico de conectividade P2P
 * 
 * Testa cada componente do sistema para identificar problemas
 */

import KeyManagementService from './KeyManagementService';
import NostrService from './NostrService';
import RideMatchingService from './RideMatchingService';

class DiagnosticService {
  async runFullDiagnostic() {
    const results = {
      timestamp: new Date().toISOString(),
      tests: [],
      overall: 'UNKNOWN',
    };

    console.log('======================================');
    console.log('🔍 ZUBI DIAGNOSTIC TOOL');
    console.log('======================================');

    // Test 1: KeyManagementService
    results.tests.push(await this.testKeyManagement());

    // Test 2: Nostr Connection
    results.tests.push(await this.testNostrConnection());

    // Test 3: Nostr Publish
    results.tests.push(await this.testNostrPublish());

    // Test 4: Nostr Query
    results.tests.push(await this.testNostrQuery());

    // Test 5: RideMatchingService
    results.tests.push(await this.testRideMatching());

    // Calculate overall status
    const failed = results.tests.filter(t => t.status === 'FAIL').length;
    const passed = results.tests.filter(t => t.status === 'PASS').length;

    if (failed === 0) {
      results.overall = 'PASS';
    } else if (passed === 0) {
      results.overall = 'FAIL';
    } else {
      results.overall = 'PARTIAL';
    }

    console.log('======================================');
    console.log(`📊 OVERALL: ${results.overall}`);
    console.log(`✅ Passed: ${passed}/${results.tests.length}`);
    console.log(`❌ Failed: ${failed}/${results.tests.length}`);
    console.log('======================================');

    return results;
  }

  async testKeyManagement() {
    console.log('\n[TEST 1] KeyManagementService...');
    
    try {
      if (!KeyManagementService.initialized) {
        return {
          name: 'KeyManagement',
          status: 'FAIL',
          message: 'KeyManagementService not initialized',
          details: 'Keys não foram gerados. Execute initialize() primeiro.',
        };
      }

      if (!KeyManagementService.privateKey) {
        return {
          name: 'KeyManagement',
          status: 'FAIL',
          message: 'Private key not available',
          details: 'KeyManagementService initialized mas privateKey é null',
        };
      }

      const pubKey = KeyManagementService.getNostrPublicKey();
      console.log('✅ KeyManagement OK - Public Key:', pubKey.substring(0, 16) + '...');

      return {
        name: 'KeyManagement',
        status: 'PASS',
        message: 'KeyManagementService initialized and working',
        details: {
          publicKey: pubKey.substring(0, 16) + '...',
          hasPrivateKey: true,
        },
      };
    } catch (error) {
      console.log('❌ KeyManagement FAIL:', error.message);
      return {
        name: 'KeyManagement',
        status: 'FAIL',
        message: error.message,
        details: error.stack,
      };
    }
  }

  async testNostrConnection() {
    console.log('\n[TEST 2] Nostr Connection...');
    
    try {
      const result = await NostrService.connect();
      
      if (result.success) {
        console.log('✅ Nostr Connection OK');
        return {
          name: 'NostrConnection',
          status: 'PASS',
          message: 'Successfully connected to Nostr relays',
          details: {
            relays: NostrService.relays,
          },
        };
      } else {
        console.log('❌ Nostr Connection FAIL:', result.error);
        return {
          name: 'NostrConnection',
          status: 'FAIL',
          message: result.error,
          details: 'Não conseguiu conectar aos relays Nostr',
        };
      }
    } catch (error) {
      console.log('❌ Nostr Connection FAIL:', error.message);
      return {
        name: 'NostrConnection',
        status: 'FAIL',
        message: error.message,
        details: error.stack,
      };
    }
  }

  async testNostrPublish() {
    console.log('\n[TEST 3] Nostr Publish...');
    
    try {
      const testMessage = `Test from Zubi Diagnostic - ${Date.now()}`;
      const result = await NostrService.publishEvent(1, testMessage, [['t', 'zubi-test']]);
      
      if (result.success) {
        console.log('✅ Nostr Publish OK - Event ID:', result.eventId);
        return {
          name: 'NostrPublish',
          status: 'PASS',
          message: 'Successfully published event to Nostr',
          details: {
            eventId: result.eventId,
          },
        };
      } else {
        console.log('❌ Nostr Publish FAIL:', result.error);
        return {
          name: 'NostrPublish',
          status: 'FAIL',
          message: result.error,
          details: 'Não conseguiu publicar evento no Nostr',
        };
      }
    } catch (error) {
      console.log('❌ Nostr Publish FAIL:', error.message);
      return {
        name: 'NostrPublish',
        status: 'FAIL',
        message: error.message,
        details: error.stack,
      };
    }
  }

  async testNostrQuery() {
    console.log('\n[TEST 4] Nostr Query...');
    
    try {
      if (!NostrService.pool) {
        await NostrService.connect();
      }

      const filters = [{
        kinds: [1],
        limit: 1,
      }];

      const events = await NostrService.pool.list(NostrService.relays, filters);
      
      if (events && events.length > 0) {
        console.log('✅ Nostr Query OK - Found', events.length, 'events');
        return {
          name: 'NostrQuery',
          status: 'PASS',
          message: `Successfully queried Nostr - found ${events.length} events`,
          details: {
            eventsFound: events.length,
          },
        };
      } else {
        console.log('⚠️  Nostr Query - No events found (relay may be empty)');
        return {
          name: 'NostrQuery',
          status: 'PASS',
          message: 'Query successful but no events found',
          details: 'Relays estão respondendo mas não há eventos',
        };
      }
    } catch (error) {
      console.log('❌ Nostr Query FAIL:', error.message);
      return {
        name: 'NostrQuery',
        status: 'FAIL',
        message: error.message,
        details: error.stack,
      };
    }
  }

  async testRideMatching() {
    console.log('\n[TEST 5] RideMatchingService...');
    
    try {
      const testLocation = {
        latitude: -23.5505,
        longitude: -46.6333,
      };

      const drivers = await RideMatchingService.findNearbyDrivers(testLocation, 10);
      
      console.log('✅ RideMatching OK - Found', drivers.length, 'drivers');
      return {
        name: 'RideMatching',
        status: 'PASS',
        message: `Found ${drivers.length} nearby drivers`,
        details: {
          driversFound: drivers.length,
          location: testLocation,
        },
      };
    } catch (error) {
      console.log('❌ RideMatching FAIL:', error.message);
      return {
        name: 'RideMatching',
        status: 'FAIL',
        message: error.message,
        details: error.stack,
      };
    }
  }

  // Test específico para motorista
  async testDriverAnnouncement(driverProfile, location) {
    console.log('\n[DRIVER TEST] Announcing driver...');
    
    try {
      const result = await RideMatchingService.announceDriverAvailability(
        driverProfile,
        location
      );

      if (result.success) {
        console.log('✅ Driver announced successfully');
        
        // Verificar se foi publicado no Nostr
        setTimeout(async () => {
          const drivers = await NostrService.findNearbyDrivers(location, 10);
          console.log('📡 Nostr query found', drivers.drivers.length, 'drivers');
        }, 2000);

        return {
          status: 'PASS',
          message: 'Driver announced successfully',
          driverId: result.driverId,
        };
      } else {
        return {
          status: 'FAIL',
          message: 'Failed to announce driver',
        };
      }
    } catch (error) {
      console.log('❌ Driver announcement FAIL:', error.message);
      return {
        status: 'FAIL',
        message: error.message,
      };
    }
  }
}

export default new DiagnosticService();
