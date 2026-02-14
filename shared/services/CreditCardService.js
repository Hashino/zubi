/**
 * CreditCardService - Credit card payment integration
 * 
 * Integrates with payment gateway (Stripe, Mercado Pago, etc)
 * IMPORTANT: Requires proper PCI-DSS compliance
 */

class CreditCardService {
  constructor() {
    this.gatewayUrl = process.env.PAYMENT_GATEWAY_URL;
    this.apiKey = process.env.PAYMENT_GATEWAY_API_KEY;
    
    if (!this.apiKey) {
      console.warn('[CreditCardService] API key not configured');
    }
  }

  /**
   * Tokenize credit card (PCI-compliant)
   * NEVER send raw card data to your server
   */
  async tokenizeCard(cardData) {
    throw new Error('CreditCardService.tokenizeCard() not implemented - configure payment gateway');
  }

  /**
   * Create charge using tokenized card
   */
  async createCharge({ amount, cardToken, description, metadata }) {
    throw new Error('CreditCardService.createCharge() not implemented - configure payment gateway');
  }

  /**
   * Refund a charge
   */
  async refundCharge(chargeId, amount) {
    throw new Error('CreditCardService.refundCharge() not implemented - configure payment gateway');
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
