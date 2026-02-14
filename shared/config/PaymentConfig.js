/**
 * Payment Integration Configuration
 * 
 * Set environment variables for production:
 * - MERCADOPAGO_PUBLIC_KEY
 * - MERCADOPAGO_ACCESS_TOKEN
 * - STRIPE_PUBLISHABLE_KEY
 * - STRIPE_SECRET_KEY
 * - WEB3_CONTRACT_ADDRESS
 * - WEB3_RPC_URL
 * - PLATFORM_WALLET
 * - GOVERNANCE_WALLET
 */

export const PaymentConfig = {
  // Gateway Selection
  gateway: process.env.PAYMENT_GATEWAY || 'mercadopago', // 'mercadopago' or 'stripe'
  
  // API Keys (REQUIRED: Set via environment variables)
  mercadoPago: {
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  },
  
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
  },
  
  // Web3 Configuration
  web3: {
    contractAddress: process.env.WEB3_CONTRACT_ADDRESS,
    network: process.env.WEB3_NETWORK || 'polygon',
    rpcUrl: process.env.WEB3_RPC_URL || 'https://polygon-rpc.com',
    platformWallet: process.env.PLATFORM_WALLET,
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
};

export default PaymentConfig;
