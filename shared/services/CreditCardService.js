/**
 * CreditCardService - Credit card payment integration
 * 
 * For MVP: Mock implementation
 * Production: Integrate with real gateway (Stripe, Mercado Pago, etc)
 */

class CreditCardService {
  constructor() {
    // TODO: Add real gateway API keys
    this.gatewayUrl = 'https://api.stripe.com'; // Example
    this.apiKey = process.env.STRIPE_API_KEY || 'mock_key';
  }

  /**
   * Tokenize credit card (PCI-compliant)
   */
  async tokenizeCard(cardData) {
    // TODO: Use gateway's client-side SDK to tokenize card
    // NEVER send raw card data to your server
    // Example with Stripe.js:
    // const token = await stripe.createToken('card', cardElement);
    
    // Mock implementation
    return {
      token: `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      last4: cardData.number.slice(-4),
      brand: this.detectCardBrand(cardData.number),
      expiryMonth: cardData.expiryMonth,
      expiryYear: cardData.expiryYear,
    };
  }

  /**
   * Create charge using tokenized card
   */
  async createCharge({ amount, cardToken, description, metadata }) {
    // TODO: Replace with real gateway API call
    // Example with Stripe:
    // const charge = await fetch(`${this.gatewayUrl}/v1/charges`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //   },
    //   body: new URLSearchParams({
    //     amount: Math.round(amount * 100), // cents
    //     currency: 'brl',
    //     source: cardToken,
    //     description,
    //   }),
    // });
    
    // Mock implementation for MVP
    const chargeId = `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock success (90% success rate)
    const success = Math.random() > 0.1;
    
    if (!success) {
      throw new Error('Cartão recusado. Verifique os dados ou tente outro cartão.');
    }
    
    return {
      id: chargeId,
      amount,
      status: 'succeeded',
      cardLast4: cardToken.slice(-4),
      createdAt: Date.now(),
      metadata,
    };
  }

  /**
   * Refund a charge
   */
  async refundCharge(chargeId, amount) {
    // TODO: Implement with real gateway
    return {
      success: true,
      refundId: `re_${Date.now()}`,
      chargeId,
      amount,
    };
  }

  /**
   * Detect card brand from number
   */
  detectCardBrand(cardNumber) {
    const patterns = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      elo: /^(4011|4312|4389|4514|4576|5041|5066|5067|6277|6362|6363|6504|6505|6516)/,
    };
    
    for (const [brand, pattern] of Object.entries(patterns)) {
      if (pattern.test(cardNumber)) {
        return brand;
      }
    }
    
    return 'unknown';
  }

  /**
   * Validate card number (Luhn algorithm)
   */
  validateCardNumber(cardNumber) {
    const digits = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }
}

export default new CreditCardService();
