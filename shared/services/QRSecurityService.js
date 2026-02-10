import * as Crypto from 'expo-crypto';

class QRSecurityService {
  // Generate a signed QR code data
  async generateSecureQRData(data) {
    try {
      const { driverId, tripId, passengerId } = data;
      
      // Create payload
      const timestamp = Date.now();
      const nonce = Math.random().toString(36).substr(2, 9);
      
      const payload = {
        driverId,
        tripId,
        passengerId,
        timestamp,
        nonce,
      };

      // Generate signature (HMAC-like using SHA256)
      const payloadString = JSON.stringify(payload);
      const signature = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        payloadString + process.env.QR_SECRET || 'zubi_secret_key_2026'
      );

      return {
        ...payload,
        signature,
        version: '1.0',
      };
    } catch (error) {
      console.error('QR generation error:', error);
      throw error;
    }
  }

  // Validate signed QR code data
  async validateSecureQRData(qrData) {
    try {
      const { driverId, tripId, passengerId, timestamp, nonce, signature, version } = qrData;

      // Check version
      if (version !== '1.0') {
        return {
          valid: false,
          error: 'Versão do QR code incompatível'
        };
      }

      // Check timestamp (max 5 minutes old)
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes in milliseconds
      if (now - timestamp > maxAge) {
        return {
          valid: false,
          error: 'QR code expirado. Solicite um novo código ao motorista.'
        };
      }

      // Check timestamp is not in the future (clock skew protection)
      if (timestamp > now + 60000) { // 1 minute tolerance
        return {
          valid: false,
          error: 'QR code inválido (timestamp futuro)'
        };
      }

      // Verify signature
      const payload = { driverId, tripId, passengerId, timestamp, nonce };
      const payloadString = JSON.stringify(payload);
      const expectedSignature = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        payloadString + process.env.QR_SECRET || 'zubi_secret_key_2026'
      );

      if (signature !== expectedSignature) {
        return {
          valid: false,
          error: 'QR code inválido (assinatura incorreta)'
        };
      }

      // All checks passed
      return {
        valid: true,
        data: payload
      };
    } catch (error) {
      console.error('QR validation error:', error);
      return {
        valid: false,
        error: 'Erro ao validar QR code: ' + error.message
      };
    }
  }

  // Generate a simpler QR code for development/testing
  async generateSimpleQRData(data) {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substr(2, 9);
    
    return {
      ...data,
      timestamp,
      nonce,
      version: '1.0',
    };
  }

  // Validate simple QR code (for development/testing)
  async validateSimpleQRData(qrData) {
    const { timestamp } = qrData;
    
    // Check timestamp (max 5 minutes old)
    const now = Date.now();
    const maxAge = 5 * 60 * 1000;
    if (now - timestamp > maxAge) {
      return {
        valid: false,
        error: 'QR code expirado'
      };
    }

    return {
      valid: true,
      data: qrData
    };
  }

  // Format QR data for display
  formatQRDataForDisplay(qrData) {
    return JSON.stringify(qrData);
  }

  // Parse QR data from scanned string
  parseQRDataFromScan(scannedString) {
    try {
      const data = JSON.parse(scannedString);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: 'QR code inválido ou corrompido'
      };
    }
  }

  // Generate a user-friendly code for manual entry (fallback)
  generateBackupCode(tripId) {
    // Generate a 6-digit code based on trip ID
    const hash = tripId.split('').reduce((acc, char) => {
      return (acc << 5) - acc + char.charCodeAt(0);
    }, 0);
    const code = Math.abs(hash % 1000000).toString().padStart(6, '0');
    return code;
  }

  // Validate backup code
  validateBackupCode(tripId, enteredCode) {
    const expectedCode = this.generateBackupCode(tripId);
    return enteredCode === expectedCode;
  }
}

export default new QRSecurityService();
