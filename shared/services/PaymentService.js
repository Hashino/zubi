/**
 * PaymentService - Orquestrador de pagamentos híbrido
 * 
 * Suporta:
 * - Crypto (Web3) - Taxa vai direto para rede via smart contract
 * - PIX - Via gateway tradicional (Mercado Pago, Stripe, etc)
 * - Cartão de Crédito - Via gateway tradicional
 * - Dinheiro - Registro local
 */

import Web3PaymentService from './Web3PaymentService';
import PixPaymentService from './PixPaymentService';
import CreditCardService from './CreditCardService';

export const PaymentMethod = {
  CRYPTO: 'CRYPTO',
  PIX: 'PIX',
  CREDIT_CARD: 'CREDIT_CARD',
  CASH: 'CASH',
};

export const PaymentStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
};

class PaymentService {
  constructor() {
    this.web3Service = Web3PaymentService;
    this.pixService = PixPaymentService;
    this.cardService = CreditCardService;
    
    // Configuração de taxas
    this.PLATFORM_FEE_PERCENTAGE = 5; // 5% de taxa padrão
    this.CRYPTO_DISCOUNT_PERCENTAGE = 2; // Desconto de 2% para incentivar crypto
  }

  /**
   * Calcula o valor final considerando taxas
   */
  calculatePaymentBreakdown(baseAmount, paymentMethod) {
    const platformFee = paymentMethod === PaymentMethod.CRYPTO
      ? baseAmount * (this.PLATFORM_FEE_PERCENTAGE - this.CRYPTO_DISCOUNT_PERCENTAGE) / 100
      : baseAmount * this.PLATFORM_FEE_PERCENTAGE / 100;
    
    const driverAmount = baseAmount - platformFee;
    
    // Gateway fees (apenas para pagamentos tradicionais)
    let gatewayFee = 0;
    if (paymentMethod === PaymentMethod.PIX) {
      gatewayFee = baseAmount * 0.99 / 100; // ~R$ 0,99 por PIX no Mercado Pago
    } else if (paymentMethod === PaymentMethod.CREDIT_CARD) {
      gatewayFee = baseAmount * 3.99 / 100; // ~3.99% no cartão
    }
    
    return {
      baseAmount,
      platformFee,
      driverAmount,
      gatewayFee,
      totalAmount: baseAmount,
      passengerPays: baseAmount,
      driverReceives: driverAmount,
      platformReceives: platformFee,
    };
  }

  /**
   * Processa pagamento baseado no método escolhido
   */
  async processPayment(rideDetails, paymentMethod, paymentData) {
    const breakdown = this.calculatePaymentBreakdown(
      rideDetails.amount,
      paymentMethod
    );

    const payment = {
      id: this.generatePaymentId(),
      rideId: rideDetails.id,
      method: paymentMethod,
      status: PaymentStatus.PENDING,
      breakdown,
      timestamp: new Date().toISOString(),
    };

    try {
      switch (paymentMethod) {
        case PaymentMethod.CRYPTO:
          return await this.processCryptoPayment(payment, rideDetails, paymentData);
        
        case PaymentMethod.PIX:
          return await this.processPixPayment(payment, rideDetails, paymentData);
        
        case PaymentMethod.CREDIT_CARD:
          return await this.processCreditCardPayment(payment, rideDetails, paymentData);
        
        case PaymentMethod.CASH:
          return await this.processCashPayment(payment, rideDetails);
        
        default:
          throw new Error(`Método de pagamento não suportado: ${paymentMethod}`);
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      payment.status = PaymentStatus.FAILED;
      payment.error = error.message;
      throw error;
    }
  }

  /**
   * CRYPTO - Smart contract distribui automaticamente
   * Você não toca no dinheiro, tudo on-chain
   */
  async processCryptoPayment(payment, rideDetails, paymentData) {
    payment.status = PaymentStatus.PROCESSING;
    
    // Validação: driver deve ter carteira crypto configurada
    if (!rideDetails.driverWallet) {
      throw new Error('Driver wallet address not configured');
    }
    
    // Smart contract cria escrow e distribui automaticamente quando corrida completa
    const txHash = await this.web3Service.createRideEscrow({
      rideId: rideDetails.id,
      passengerAddress: paymentData.walletAddress,
      driverAddress: rideDetails.driverWallet,
      amount: payment.breakdown.baseAmount,
      platformFee: payment.breakdown.platformFee,
    });
    
    payment.status = PaymentStatus.COMPLETED;
    payment.transactionHash = txHash;
    payment.blockchain = 'ethereum'; // ou 'polygon', 'arbitrum', etc
    
    return payment;
  }

  /**
   * PIX - Gateway tradicional + distribuição automática
   */
  async processPixPayment(payment, rideDetails, paymentData) {
    payment.status = PaymentStatus.PROCESSING;
    
    // Gera QR Code PIX via gateway (Mercado Pago, Stripe, etc)
    const pixData = await this.pixService.createPixCharge({
      amount: payment.breakdown.baseAmount,
      description: `Zubi - Corrida #${rideDetails.id}`,
      metadata: {
        rideId: rideDetails.id,
        driverId: rideDetails.driverId,
        passengerId: rideDetails.passengerId,
      },
    });
    
    payment.pixQrCode = pixData.qrCode;
    payment.pixCopyPaste = pixData.copyPaste;
    payment.expiresAt = pixData.expiresAt;
    
    // Webhook do gateway notificará quando pagamento for confirmado
    // Então PaymentDistributionService transfere para o motorista
    
    return payment;
  }

  /**
   * Cartão de Crédito - Gateway tradicional + distribuição automática
   */
  async processCreditCardPayment(payment, rideDetails, paymentData) {
    payment.status = PaymentStatus.PROCESSING;
    
    // Processa via gateway (Stripe, Mercado Pago, etc)
    const charge = await this.cardService.createCharge({
      amount: payment.breakdown.baseAmount,
      cardToken: paymentData.cardToken,
      description: `Zubi - Corrida #${rideDetails.id}`,
      metadata: {
        rideId: rideDetails.id,
        driverId: rideDetails.driverId,
      },
    });
    
    payment.status = PaymentStatus.COMPLETED;
    payment.chargeId = charge.id;
    
    // Distribui para motorista após confirmação
    // PaymentDistributionService agenda transferência
    
    return payment;
  }

  /**
   * Dinheiro - Apenas registro, sem processamento
   */
  async processCashPayment(payment, rideDetails) {
    // Marca como pago em dinheiro, motorista confirma recebimento
    payment.status = PaymentStatus.COMPLETED;
    payment.requiresDriverConfirmation = true;
    
    return payment;
  }

  /**
   * Busca um pagamento por ID
   */
  async getPayment(paymentId) {
    console.warn('[PaymentService] Payment persistence not implemented:', paymentId);
    return null;
  }

  /**
   * Completa pagamento após corrida finalizar
   * (Para crypto, libera escrow no smart contract)
   */
  async completePayment(paymentId, rideId) {
    const payment = await this.getPayment(paymentId);
    
    if (!payment) {
      console.warn('[PaymentService] Payment not found:', paymentId);
      return { success: false, error: 'Payment not found' };
    }
    
    if (payment.method === PaymentMethod.CRYPTO) {
      // Libera escrow no smart contract
      await this.web3Service.releaseEscrow(rideId);
    }
    
    // Pagamentos tradicionais já foram processados
    return payment;
  }

  /**
   * Gera ID único para pagamento
   */
  generatePaymentId() {
    return `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Lista métodos de pagamento disponíveis para o usuário
   */
  async getAvailablePaymentMethods(userProfile) {
    const methods = [
      {
        type: PaymentMethod.CASH,
        name: 'Dinheiro',
        icon: '💵',
        available: true,
        fee: '0%',
      },
      {
        type: PaymentMethod.PIX,
        name: 'PIX',
        icon: '🔷',
        available: true,
        fee: '5%',
      },
      {
        type: PaymentMethod.CREDIT_CARD,
        name: 'Cartão de Crédito',
        icon: '💳',
        available: true,
        fee: '5%',
      },
    ];

    // Crypto disponível apenas se usuário tem carteira conectada
    if (userProfile.hasWeb3Wallet) {
      methods.push({
        type: PaymentMethod.CRYPTO,
        name: 'Crypto (USDC/ETH)',
        icon: '⚡',
        available: true,
        fee: '3%', // Desconto de 2% para incentivar
        discount: true,
        badge: 'DESCONTO',
      });
    }

    return methods;
  }
}

export default new PaymentService();
