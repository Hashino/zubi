import * as Crypto from 'expo-crypto';
import { getPublicKey, sign, verify } from '@noble/secp256k1';
import StorageService from './StorageService';

/**
 * KeyManagementService - Gerencia keypairs criptográficas para assinaturas
 * Implementa o sistema de identidade soberana do PMCD
 */
class KeyManagementService {
  constructor() {
    this.privateKey = null;
    this.publicKey = null;
    this.initialized = false;
  }

  /**
   * Inicializa ou recupera keypair do usuário
   */
  async initialize(userId) {
    try {
      // Tenta recuperar keypair existente
      const stored = await StorageService.getItem(`keypair_${userId}`);
      
      if (stored) {
        this.privateKey = stored.privateKey;
        this.publicKey = stored.publicKey;
      } else {
        // Gera novo keypair
        await this.generateKeypair(userId);
      }
      
      this.initialized = true;
      return { success: true, publicKey: this.publicKey };
    } catch (error) {
      console.error('[KeyManagementService] Initialize failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gera novo keypair secp256k1
   */
  async generateKeypair(userId) {
    try {
      // Gera 32 bytes aleatórios para private key
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      const privateKeyArray = new Uint8Array(randomBytes);
      
      // Gera public key usando secp256k1
      const publicKeyArray = await getPublicKey(privateKeyArray);
      
      // Converte para hex
      this.privateKey = this.bytesToHex(privateKeyArray);
      this.publicKey = this.bytesToHex(publicKeyArray);
      
      // Salva no storage
      await StorageService.setItem(`keypair_${userId}`, {
        privateKey: this.privateKey,
        publicKey: this.publicKey,
        createdAt: Date.now(),
      });
      
      console.log('[KeyManagementService] Keypair generated:', this.publicKey.slice(0, 10) + '...');
      return { success: true, publicKey: this.publicKey };
    } catch (error) {
      console.error('[KeyManagementService] Generate keypair failed:', error);
      throw error;
    }
  }

  /**
   * Assina uma mensagem com a private key
   */
  async signMessage(message) {
    if (!this.initialized || !this.privateKey) {
      throw new Error('KeyManagementService not initialized');
    }

    try {
      // Converte mensagem para hash
      const messageHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        message
      );
      
      const messageHashBytes = this.hexToBytes(messageHash);
      const privateKeyBytes = this.hexToBytes(this.privateKey);
      
      // Assina com secp256k1
      const signature = await sign(messageHashBytes, privateKeyBytes);
      
      return {
        signature: this.bytesToHex(signature),
        publicKey: this.publicKey,
        message,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[KeyManagementService] Sign message failed:', error);
      throw error;
    }
  }

  /**
   * Verifica assinatura de uma mensagem
   */
  async verifySignature(message, signature, publicKey) {
    try {
      // Hash da mensagem
      const messageHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        message
      );
      
      const messageHashBytes = this.hexToBytes(messageHash);
      const signatureBytes = this.hexToBytes(signature);
      const publicKeyBytes = this.hexToBytes(publicKey);
      
      // Verifica com secp256k1
      const isValid = await verify(signatureBytes, messageHashBytes, publicKeyBytes);
      
      return isValid;
    } catch (error) {
      console.error('[KeyManagementService] Verify signature failed:', error);
      return false;
    }
  }

  /**
   * Assina dados de uma viagem (para finalização)
   */
  async signRideCompletion(rideData) {
    const message = JSON.stringify({
      rideId: rideData.rideId,
      passengerId: rideData.passengerId,
      driverId: rideData.driverId,
      startTime: rideData.startTime,
      endTime: rideData.endTime,
      fare: rideData.fare,
      distance: rideData.distance,
    });
    
    return await this.signMessage(message);
  }

  /**
   * Gera token de presença para validação durante viagem
   */
  async generatePresenceToken(rideId, timestamp) {
    const message = `presence:${rideId}:${timestamp}`;
    return await this.signMessage(message);
  }

  /**
   * Verifica token de presença
   */
  async verifyPresenceToken(token, rideId, publicKey) {
    const message = `presence:${rideId}:${token.timestamp}`;
    return await this.verifySignature(message, token.signature, publicKey);
  }

  /**
   * Exporta public key no formato Nostr (hex)
   */
  getNostrPublicKey() {
    return this.publicKey;
  }

  /**
   * Helpers para conversão de bytes
   */
  bytesToHex(bytes) {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  }

  /**
   * Reseta keypair (use com cuidado!)
   */
  async reset(userId) {
    this.privateKey = null;
    this.publicKey = null;
    this.initialized = false;
    await StorageService.removeItem(`keypair_${userId}`);
  }
}

export default new KeyManagementService();
