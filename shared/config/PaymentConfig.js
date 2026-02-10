/**
 * Lightweight Payment Integration Config
 * 
 * For production, replace with real API keys:
 * - PIX_GATEWAY_KEY
 * - CARD_GATEWAY_KEY
 * - WEB3_CONTRACT_ADDRESS
 */

export const PaymentConfig = {
  // Gateway Selection
  gateway: 'mercadopago', // 'mercadopago', 'stripe', or 'mock'
  
  // API Keys (use environment variables in production)
  mercadoPago: {
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || 'TEST-mock-public-key',
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-mock-access-token',
  },
  
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_mock',
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_mock',
  },
  
  // Web3 Configuration
  web3: {
    contractAddress: process.env.WEB3_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    network: 'polygon', // 'ethereum', 'polygon', 'arbitrum', 'base'
    rpcUrl: process.env.WEB3_RPC_URL || 'https://polygon-rpc.com',
    platformWallet: process.env.PLATFORM_WALLET || '0x0000000000000000000000000000000000000000',
  },
  
  // Fee Configuration
  fees: {
    platform: {
      cash: 5.0,      // 5%
      pix: 5.0,       // 5%
      card: 5.0,      // 5%
      crypto: 3.0,    // 3% (2% discount)
    },
    gateway: {
      pix: 0.99,      // R$ 0.99 per transaction
      card: 3.99,     // 3.99%
      crypto: 0.001,  // ~$0.001 gas fee
    },
  },
  
  // Mock Mode (for MVP testing)
  useMockPayments: true, // Set to false when integrating real gateways
};

export default PaymentConfig;
