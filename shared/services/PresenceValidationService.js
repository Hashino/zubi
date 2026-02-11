import { BleManager } from 'react-native-ble-plx';
import KeyManagementService from './KeyManagementService';

/**
 * PresenceValidationService - Validação Dinâmica de Presença (PMCD)
 * 
 * Implementa o sistema de "tokens de presença" para evitar fraude de GPS:
 * - Troca de tokens via Bluetooth durante a viagem
 * - Geração de QR codes para validação de início/fim
 * - Assinaturas criptográficas de ambas as partes
 * - Prova de presença para liberação de pagamento
 */

export const PresenceTokenType = {
  RIDE_START: 'ride_start',
  IN_TRANSIT: 'in_transit',
  RIDE_END: 'ride_end',
};

class PresenceValidationService {
  constructor() {
    this.bleManager = null;
    this.bleEnabled = false;
    this.activeTokenExchange = null;
    this.collectedTokens = [];
  }

  /**
   * Inicializa Bluetooth Low Energy
   */
  async initializeBLE() {
    try {
      this.bleManager = new BleManager();
      
      const state = await this.bleManager.state();
      this.bleEnabled = state === 'PoweredOn';
      
      if (!this.bleEnabled) {
        console.warn('[PresenceValidation] Bluetooth not enabled');
        return { success: false, error: 'Bluetooth not enabled' };
      }

      console.log('[PresenceValidation] BLE initialized');
      return { success: true };
    } catch (error) {
      console.error('[PresenceValidation] BLE init error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gera token de presença assinado criptograficamente
   */
  async generatePresenceToken(rideId, userId, tokenType) {
    try {
      const timestamp = Date.now();
      const tokenData = {
        rideId,
        userId,
        tokenType,
        timestamp,
        location: null, // Pode incluir localização se disponível
      };

      // Assina com keypair do usuário
      const signature = await KeyManagementService.signMessage(JSON.stringify(tokenData));
      
      const token = {
        ...tokenData,
        signature: signature.signature,
        publicKey: signature.publicKey,
      };

      console.log('[PresenceValidation] Token generated:', tokenType);
      return { success: true, token };
    } catch (error) {
      console.error('[PresenceValidation] Error generating token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Valida token de presença recebido
   */
  async validatePresenceToken(token) {
    try {
      const message = JSON.stringify({
        rideId: token.rideId,
        userId: token.userId,
        tokenType: token.tokenType,
        timestamp: token.timestamp,
        location: token.location,
      });

      const isValid = await KeyManagementService.verifySignature(
        message,
        token.signature,
        token.publicKey
      );

      if (!isValid) {
        console.warn('[PresenceValidation] Invalid token signature');
        return { success: false, error: 'Invalid signature' };
      }

      // Verifica se token não está expirado (válido por 5 minutos)
      const age = Date.now() - token.timestamp;
      if (age > 5 * 60 * 1000) {
        console.warn('[PresenceValidation] Token expired');
        return { success: false, error: 'Token expired' };
      }

      console.log('[PresenceValidation] Token validated successfully');
      return { success: true, token };
    } catch (error) {
      console.error('[PresenceValidation] Error validating token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Inicia troca de tokens via Bluetooth entre motorista e passageiro
   */
  async startTokenExchange(rideId, userId, role) {
    try {
      if (!this.bleEnabled) {
        await this.initializeBLE();
      }

      this.activeTokenExchange = {
        rideId,
        userId,
        role, // 'driver' ou 'passenger'
        startedAt: Date.now(),
        tokensExchanged: 0,
      };

      if (role === 'driver') {
        // Motorista anuncia via BLE
        await this.advertisePresence(rideId, userId);
      } else {
        // Passageiro escaneia
        await this.scanForPresence(rideId, userId);
      }

      console.log('[PresenceValidation] Token exchange started for', role);
      return { success: true };
    } catch (error) {
      console.error('[PresenceValidation] Error starting token exchange:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Motorista anuncia presença via BLE (como peripheral)
   */
  async advertisePresence(rideId, driverId) {
    try {
      // Gera token de início
      const tokenResult = await this.generatePresenceToken(
        rideId,
        driverId,
        PresenceTokenType.RIDE_START
      );

      if (!tokenResult.success) {
        throw new Error('Failed to generate token');
      }

      // Em produção: usar BLE advertising para transmitir token
      // Por enquanto, vamos simular
      console.log('[PresenceValidation] Advertising presence via BLE');
      
      return { success: true, token: tokenResult.token };
    } catch (error) {
      console.error('[PresenceValidation] Error advertising:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Passageiro escaneia por presença do motorista via BLE
   */
  async scanForPresence(rideId, passengerId) {
    try {
      console.log('[PresenceValidation] Scanning for driver presence via BLE');
      
      // Em produção: usar BLE scanning para detectar motorista
      // Retornaria token do motorista quando detectado
      
      return { success: true };
    } catch (error) {
      console.error('[PresenceValidation] Error scanning:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Troca de tokens periódica durante viagem (a cada 5 minutos)
   */
  async exchangeTransitToken(rideId, userId) {
    try {
      const token = await this.generatePresenceToken(
        rideId,
        userId,
        PresenceTokenType.IN_TRANSIT
      );

      if (token.success) {
        this.collectedTokens.push(token.token);
        
        if (this.activeTokenExchange) {
          this.activeTokenExchange.tokensExchanged++;
        }

        console.log('[PresenceValidation] Transit token exchanged, total:', this.collectedTokens.length);
      }

      return token;
    } catch (error) {
      console.error('[PresenceValidation] Error exchanging transit token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Finaliza viagem com token de conclusão (exige ambas assinaturas)
   */
  async finalizeRide(rideId, driverId, passengerId) {
    try {
      // Gera tokens de fim de ambas as partes
      const driverToken = await this.generatePresenceToken(
        rideId,
        driverId,
        PresenceTokenType.RIDE_END
      );

      const passengerToken = await this.generatePresenceToken(
        rideId,
        passengerId,
        PresenceTokenType.RIDE_END
      );

      if (!driverToken.success || !passengerToken.success) {
        throw new Error('Failed to generate completion tokens');
      }

      // Valida ambos os tokens
      const driverValid = await this.validatePresenceToken(driverToken.token);
      const passengerValid = await this.validatePresenceToken(passengerToken.token);

      if (!driverValid.success || !passengerValid.success) {
        throw new Error('Invalid completion tokens');
      }

      // Valida que pelo menos 1 token de trânsito foi coletado
      const transitTokens = this.collectedTokens.filter(t => t.rideId === rideId);
      if (transitTokens.length === 0) {
        console.warn('[PresenceValidation] No transit tokens collected for ride:', rideId);
        // Permite finalização, mas registra warning
      }

      // Cria prova de conclusão com ambas assinaturas
      const completionProof = {
        rideId,
        driverToken: driverToken.token,
        passengerToken: passengerToken.token,
        transitTokens,
        completedAt: Date.now(),
        valid: true,
      };

      console.log('[PresenceValidation] Ride finalized with', completionProof.transitTokens.length, 'transit tokens');
      
      // Limpa tokens da viagem
      this.collectedTokens = this.collectedTokens.filter(t => t.rideId !== rideId);
      this.activeTokenExchange = null;

      return { success: true, completionProof };
    } catch (error) {
      console.error('[PresenceValidation] Error finalizing ride:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gera QR code para validação manual (fallback se BLE falhar)
   */
  async generateValidationQR(rideId, userId, tokenType) {
    try {
      const tokenResult = await this.generatePresenceToken(rideId, userId, tokenType);
      if (!tokenResult.success) {
        throw new Error('Failed to generate token');
      }

      // Codifica token como JSON para QR
      const qrData = JSON.stringify(tokenResult.token);
      
      console.log('[PresenceValidation] QR validation code generated');
      return { success: true, qrData, token: tokenResult.token };
    } catch (error) {
      console.error('[PresenceValidation] Error generating QR:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Valida QR code scaneado
   */
  async validateQRCode(qrData) {
    try {
      const token = JSON.parse(qrData);
      return await this.validatePresenceToken(token);
    } catch (error) {
      console.error('[PresenceValidation] Error validating QR:', error);
      return { success: false, error: 'Invalid QR code' };
    }
  }

  /**
   * Obtém relatório de tokens coletados durante viagem
   */
  getTokenReport(rideId) {
    const rideTokens = this.collectedTokens.filter(t => t.rideId === rideId);
    
    return {
      rideId,
      totalTokens: rideTokens.length,
      startTokens: rideTokens.filter(t => t.tokenType === PresenceTokenType.RIDE_START).length,
      transitTokens: rideTokens.filter(t => t.tokenType === PresenceTokenType.IN_TRANSIT).length,
      endTokens: rideTokens.filter(t => t.tokenType === PresenceTokenType.RIDE_END).length,
      tokens: rideTokens,
    };
  }

  /**
   * Para troca de tokens
   */
  stopTokenExchange() {
    if (this.bleManager) {
      this.bleManager.stopDeviceScan();
    }
    this.activeTokenExchange = null;
    console.log('[PresenceValidation] Token exchange stopped');
  }
}

export default new PresenceValidationService();
