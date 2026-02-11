/**
 * Web3PaymentService - Cryptocurrency payment integration with Smart Contracts
 * 
 * Implementa o sistema de pagamento do PMCD:
 * - Escrow via Smart Contract (Polygon/Arbitrum)
 * - Assinaturas de ambas as partes para liberação de pagamento
 * - Taxas dinâmicas baseadas em nível do motorista
 * - Integração com ethers.js
 */

import { ethers } from 'ethers';
import KeyManagementService from './KeyManagementService';
import GovernanceService from './GovernanceService';

// ABI simplificado do contrato de escrow
const ESCROW_CONTRACT_ABI = [
  'function createRide(bytes32 rideId, address driver, uint256 driverFee) payable',
  'function completeRide(bytes32 rideId, bytes driverSignature, bytes passengerSignature)',
  'function cancelRide(bytes32 rideId)',
  'function getRideDetails(bytes32 rideId) view returns (address passenger, address driver, uint256 amount, uint256 fee, uint8 status)',
  'event RideCreated(bytes32 indexed rideId, address passenger, address driver, uint256 amount)',
  'event RideCompleted(bytes32 indexed rideId, uint256 driverPayout, uint256 protocolFee)',
  'event RideCancelled(bytes32 indexed rideId)',
];

class Web3PaymentService {
  constructor() {
    // Smart Contract addresses (deploy primeiro)
    this.contractAddress = process.env.ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
    
    // Network configuration (Polygon Mumbai testnet para dev)
    this.networkName = 'polygon-mumbai';
    this.chainId = 80001; // Mumbai testnet
    this.rpcUrl = 'https://rpc-mumbai.maticvigil.com';
    
    // Production: usar Polygon mainnet
    // this.chainId = 137;
    // this.rpcUrl = 'https://polygon-rpc.com';
    
    // Protocol governance wallet
    this.governanceWallet = process.env.GOVERNANCE_WALLET || '0x0000000000000000000000000000000000000000';
    
    // Ethers provider e signer
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.walletAddress = null;
  }

  /**
   * Initialize Web3 provider
   */
  async initialize() {
    try {
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
      console.log('[Web3Payment] Provider initialized');
      return { success: true };
    } catch (error) {
      console.error('[Web3Payment] Init error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Connect user's Web3 wallet (MetaMask/WalletConnect)
   */
  async connectWallet() {
    try {
      // Em React Native, usa WalletConnect
      // Para MVP: gera carteira temporária a partir da keypair
      
      // Check if KeyManagementService is properly initialized
      if (!KeyManagementService.initialized) {
        throw new Error('KeyManagementService not initialized');
      }
      
      if (!KeyManagementService.privateKey) {
        throw new Error('KeyManagementService private key not available');
      }

      // Cria wallet a partir da private key existente
      const wallet = new ethers.Wallet(KeyManagementService.privateKey, this.provider);
      this.signer = wallet;
      this.walletAddress = wallet.address;
      
      // Inicializa contrato
      this.contract = new ethers.Contract(
        this.contractAddress,
        ESCROW_CONTRACT_ABI,
        this.signer
      );

      const balance = await this.provider.getBalance(this.walletAddress);
      
      console.log('[Web3Payment] Wallet connected:', this.walletAddress);
      
      return {
        success: true,
        address: this.walletAddress,
        network: this.networkName,
        balance: ethers.formatEther(balance),
      };
    } catch (error) {
      console.error('[Web3Payment] Connect wallet error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user has Web3 wallet connected
   */
  async isWalletConnected() {
    return this.walletAddress !== null;
  }

  /**
   * Get user's wallet balance (in native token and USDC)
   */
  async getBalance(walletAddress = this.walletAddress) {
    try {
      if (!walletAddress) {
        throw new Error('No wallet address');
      }

      const balance = await this.provider.getBalance(walletAddress);
      
      // TODO: Adicionar balance de USDC
      // const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, this.provider);
      // const usdcBalance = await usdcContract.balanceOf(walletAddress);
      
      return {
        success: true,
        native: ethers.formatEther(balance),
        usdc: '0', // TODO: implementar
      };
    } catch (error) {
      console.error('[Web3Payment] Get balance error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create ride escrow - lock funds in smart contract with dynamic fee
   */
  async createRideEscrow({ rideId, passengerAddress, driverAddress, driverId, amount }) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Wallet not connected');
      }

      // Obtém taxa dinâmica baseada no nível do motorista
      const driverFeeRate = await GovernanceService.getDriverFeeRate(driverId);
      
      console.log('[Web3Payment] Creating ride escrow:', {
        rideId,
        passengerAddress,
        driverAddress,
        amount,
        driverFeeRate,
      });

      // Converte rideId para bytes32
      const rideIdBytes32 = ethers.id(rideId);
      
      // Converte taxa para base points (ex: 0.15 = 1500 bp)
      const feeInBasisPoints = Math.floor(driverFeeRate * 10000);
      
      // Converte amount para Wei
      const amountInWei = ethers.parseEther(amount.toString());
      
      // Chama smart contract
      const tx = await this.contract.createRide(
        rideIdBytes32,
        driverAddress,
        feeInBasisPoints,
        { value: amountInWei }
      );
      
      console.log('[Web3Payment] Transaction sent:', tx.hash);
      
      // Aguarda confirmação
      const receipt = await tx.wait();
      
      console.log('[Web3Payment] Transaction confirmed:', receipt.hash);
      
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('[Web3Payment] Create escrow error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Release escrow when ride completes (requires signatures from both parties)
   */
  async releaseEscrow(rideId, completionProof) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Wallet not connected');
      }

      // Verifica se há assinaturas de ambas as partes
      if (!completionProof || !completionProof.driverToken || !completionProof.passengerToken) {
        throw new Error('Missing completion proof signatures');
      }

      const rideIdBytes32 = ethers.id(rideId);
      
      console.log('[Web3Payment] Releasing escrow for ride:', rideId);
      
      // Chama smart contract com assinaturas
      const tx = await this.contract.completeRide(
        rideIdBytes32,
        completionProof.driverToken.signature,
        completionProof.passengerToken.signature
      );
      
      const receipt = await tx.wait();
      
      console.log('[Web3Payment] Escrow released:', receipt.hash);
      
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('[Web3Payment] Release escrow error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel ride and refund passenger
   */
  async refundEscrow(rideId) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Wallet not connected');
      }

      const rideIdBytes32 = ethers.id(rideId);
      
      console.log('[Web3Payment] Refunding escrow for ride:', rideId);
      
      const tx = await this.contract.cancelRide(rideIdBytes32);
      const receipt = await tx.wait();
      
      console.log('[Web3Payment] Refund processed:', receipt.hash);
      
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('[Web3Payment] Refund error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get transaction receipt from blockchain
   */
  async getTransactionReceipt(txHash) {
    // TODO: Query blockchain
    // const provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
    // const receipt = await provider.getTransactionReceipt(txHash);
    
    // Mock
    return {
      transactionHash: txHash,
      status: 1, // success
      blockNumber: Math.floor(Math.random() * 1000000),
      gasUsed: '0.001',
    };
  }

  /**
   * Estimate gas cost for transaction
   */
  async estimateGasCost(operation) {
    // TODO: Get real gas estimate from network
    // const contract = new ethers.Contract(this.contractAddress, ABI, provider);
    // const gasEstimate = await contract.estimateGas.createRide(...params);
    
    // Mock - typical costs on Polygon
    const costs = {
      createRide: 0.001, // ~$0.001 on Polygon
      completeRide: 0.0015,
      cancelRide: 0.0008,
    };
    
    return costs[operation] || 0.001;
  }

  /**
   * Convert BRL to crypto amount (USDC)
   */
  async convertBrlToUSDC(brlAmount) {
    // TODO: Fetch real exchange rate from API
    // const rate = await fetch('https://api.exchangerate.host/latest?base=BRL&symbols=USD');
    
    // Mock: 1 USD = 5 BRL
    const exchangeRate = 5.0;
    return parseFloat((brlAmount / exchangeRate).toFixed(2));
  }

  /**
   * Get network explorer URL for transaction
   */
  getExplorerUrl(txHash) {
    const explorers = {
      ethereum: 'https://etherscan.io/tx/',
      polygon: 'https://polygonscan.com/tx/',
      arbitrum: 'https://arbiscan.io/tx/',
      base: 'https://basescan.org/tx/',
    };
    
    return `${explorers[this.networkName] || explorers.polygon}${txHash}`;
  }
}

export default new Web3PaymentService();
