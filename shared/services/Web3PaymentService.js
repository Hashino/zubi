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
    // Smart Contract address (REQUIRED: Set via environment variable)
    this.contractAddress = process.env.ESCROW_CONTRACT_ADDRESS;
    
    // Network configuration
    this.networkName = process.env.WEB3_NETWORK || 'polygon';
    this.chainId = process.env.WEB3_CHAIN_ID || 137; // Polygon mainnet
    this.rpcUrl = process.env.WEB3_RPC_URL || 'https://polygon-rpc.com';
    
    // Protocol governance wallet (REQUIRED: Set via environment variable)
    this.governanceWallet = process.env.GOVERNANCE_WALLET;
    
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
      
      return {
        success: true,
        native: ethers.formatEther(balance),
        usdc: '0',
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
    try {
      const provider = new ethers.JsonRpcProvider(this.rpcUrl);
      const receipt = await provider.getTransactionReceipt(txHash);
      
      return {
        transactionHash: txHash,
        status: receipt.status,
        blockNumber: receipt.blockNumber,
        gasUsed: ethers.formatEther(receipt.gasUsed),
      };
    } catch (error) {
      console.error('[Web3Payment] Get receipt error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Estimate gas cost for transaction
   */
  async estimateGasCost(operation) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      const gasEstimate = await this.contract.estimateGas[operation]();
      const gasPrice = await this.provider.getFeeData();
      
      const estimatedCost = gasEstimate * gasPrice.gasPrice;
      return parseFloat(ethers.formatEther(estimatedCost));
    } catch (error) {
      console.error('[Web3Payment] Estimate gas error:', error);
      return 0.001; // Fallback estimate
    }
  }

  /**
   * Convert BRL to crypto amount (USDC)
   */
  async convertBrlToUSDC(brlAmount) {
    try {
      const response = await fetch('https://api.exchangerate.host/latest?base=BRL&symbols=USD');
      const data = await response.json();
      const exchangeRate = data.rates.USD;
      
      return parseFloat((brlAmount * exchangeRate).toFixed(2));
    } catch (error) {
      console.error('[Web3Payment] Exchange rate fetch error:', error);
      const fallbackRate = 0.20; // Fallback: 1 BRL = 0.20 USD
      return parseFloat((brlAmount * fallbackRate).toFixed(2));
    }
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
