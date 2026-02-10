/**
 * PixPaymentService - PIX payment integration
 * 
 * For MVP: Mock implementation
 * Production: Integrate with real gateway (Mercado Pago, Stripe, etc)
 */

class PixPaymentService {
  constructor() {
    // TODO: Add real gateway API keys
    this.gatewayUrl = 'https://api.mercadopago.com'; // Example
    this.apiKey = process.env.MERCADOPAGO_API_KEY || 'mock_key';
  }

  /**
   * Create PIX charge and generate QR code
   */
  async createPixCharge({ amount, description, metadata }) {
    // TODO: Replace with real gateway API call
    // Example with Mercado Pago:
    // const response = await fetch(`${this.gatewayUrl}/v1/payments`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     transaction_amount: amount,
    //     description,
    //     payment_method_id: 'pix',
    //     payer: { email: metadata.passengerEmail },
    //   }),
    // });
    
    // Mock implementation for MVP
    const chargeId = `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Generate mock PIX data
    const pixData = {
      chargeId,
      qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`,
      copyPaste: `00020126580014BR.GOV.BCB.PIX0136${chargeId}52040000530398654${amount.toFixed(2)}5802BR5925ZUBI PAGAMENTOS LTDA6009SAO PAULO`,
      amount,
      status: 'pending',
      expiresAt: expiresAt.toISOString(),
      metadata,
    };
    
    // Simulate payment confirmation after 10 seconds (for testing)
    setTimeout(() => {
      this.simulatePaymentConfirmation(chargeId);
    }, 10000);
    
    return pixData;
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(chargeId) {
    // TODO: Replace with real gateway API call
    // Mock: return random status for testing
    return {
      chargeId,
      status: Math.random() > 0.5 ? 'paid' : 'pending',
      paidAt: Date.now(),
    };
  }

  /**
   * Simulate payment confirmation (for testing)
   */
  simulatePaymentConfirmation(chargeId) {
    console.log(`[PIX] Payment confirmed: ${chargeId}`);
    // In production, this would be a webhook from the gateway
  }

  /**
   * Cancel/expire a PIX charge
   */
  async cancelCharge(chargeId) {
    // TODO: Implement with real gateway
    return { success: true, chargeId };
  }
}

export default new PixPaymentService();
