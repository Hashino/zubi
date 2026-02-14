/**
 * PixPaymentService - PIX payment integration
 * 
 * Integrates with payment gateway (Mercado Pago, Stripe, etc)
 */

class PixPaymentService {
  constructor() {
    this.gatewayUrl = process.env.PIX_GATEWAY_URL;
    this.apiKey = process.env.PIX_GATEWAY_API_KEY;
    
    if (!this.apiKey) {
      console.warn('[PixPaymentService] API key not configured');
    }
  }

  /**
   * Create PIX charge and generate QR code
   */
  async createPixCharge({ amount, description, metadata }) {
    throw new Error('PixPaymentService.createPixCharge() not implemented - configure payment gateway');
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(chargeId) {
    throw new Error('PixPaymentService.checkPaymentStatus() not implemented - configure payment gateway');
  }

  /**
   * Cancel/expire a PIX charge
   */
  async cancelCharge(chargeId) {
    throw new Error('PixPaymentService.cancelCharge() not implemented - configure payment gateway');
  }
}

export default new PixPaymentService();
