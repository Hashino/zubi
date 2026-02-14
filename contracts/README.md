# Zubi Smart Contract Deployment Guide

## Overview

The `ZubiEscrow.sol` contract implements the PMCD (Protocolo de Mobilidade Cooperativa Descentralizada) escrow system for secure P2P rideshare payments.

## Features

- **Escrow Management**: Locks funds when ride is created
- **Dynamic Fees**: Supports variable fee rates based on driver level (5%-15%)
- **Dispute Resolution**: Built-in tribunal system for conflict resolution
- **Cryptographic Proofs**: Requires signatures from both parties to complete rides
- **Cancellation & Refunds**: Full refunds for cancelled rides
- **Governance**: Upgradeable governance wallet

## Prerequisites

1. **Node.js** (v18+ recommended, v25 works with warnings)
2. **npm** or **yarn**
3. **Wallet** with funds for deployment:
   - **Mumbai Testnet**: Get free testnet MATIC from [Polygon Faucet](https://faucet.polygon.technology/)
   - **Polygon Mainnet**: Real MATIC required
4. **PolygonScan API Key** (optional, for contract verification): [Get it here](https://polygonscan.com/apis)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
# REQUIRED: Your wallet private key (NEVER commit this!)
PRIVATE_KEY=your_64_character_private_key_without_0x

# REQUIRED: Wallet that receives protocol fees
GOVERNANCE_WALLET=0xYourGovernanceWalletAddress

# OPTIONAL: For contract verification on PolygonScan
POLYGONSCAN_API_KEY=your_api_key_here
```

**Security Warning**: NEVER commit your `.env` file or share your private key!

### 3. Compile Contract

```bash
npm run contract:compile
# or: npx hardhat compile
```

### 4. Run Tests

```bash
npm run contract:test
# or: npx hardhat test
```

All 17 tests should pass:
- ✅ Deployment
- ✅ Create Ride
- ✅ Complete Ride
- ✅ Cancel Ride
- ✅ Dispute Resolution
- ✅ Governance

## Deployment

### Option 1: Deploy to Mumbai Testnet (Recommended for Testing)

```bash
npm run contract:deploy:mumbai
```

This will:
1. Deploy the contract to Polygon Mumbai testnet
2. Save deployment info to `deployments/mumbai.json`
3. Automatically verify on PolygonScan (if API key provided)
4. Display the contract address

### Option 2: Deploy to Polygon Mainnet (Production)

**Warning**: This uses real MATIC!

```bash
npm run contract:deploy:polygon
```

### Option 3: Deploy to Local Hardhat Network (Development)

Start a local Hardhat node:

```bash
npx hardhat node
```

In another terminal:

```bash
npm run contract:deploy:local
```

## After Deployment

### 1. Update Environment Variables

Add the deployed contract address to your `.env`:

```env
ESCROW_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

### 2. Update Web3PaymentService

Edit `shared/services/Web3PaymentService.js`:

```javascript
this.contractAddress = '0xYourDeployedContractAddress';
this.chainId = 80001; // Mumbai testnet (or 137 for mainnet)
```

### 3. Verify Contract (Manual)

If automatic verification failed:

```bash
npx hardhat verify --network mumbai \
  0xYourContractAddress \
  0xYourGovernanceWallet
```

### 4. Test on Blockchain

Create a test ride:

```javascript
// Example using ethers.js
const rideId = ethers.id("test-ride-1");
const driverAddress = "0x...";
const feeRate = 1500; // 15%
const amount = ethers.parseEther("0.1"); // 0.1 MATIC

await escrow.createRide(rideId, driverAddress, feeRate, { value: amount });
```

## Contract Functions

### For Passengers & Drivers

- `createRide(bytes32 rideId, address driver, uint256 feeRate)`: Create and fund ride
- `completeRide(bytes32 rideId, bytes driverSig, bytes passengerSig)`: Complete ride with signatures
- `cancelRide(bytes32 rideId)`: Cancel ride and refund passenger
- `disputeRide(bytes32 rideId)`: Open dispute for tribunal resolution
- `getRideDetails(bytes32 rideId)`: Get ride information

### For Governance

- `resolveDispute(bytes32 rideId, bool refundToPassenger)`: Resolve dispute (owner only)
- `updateGovernanceWallet(address newWallet)`: Update fee recipient (owner only)
- `emergencyWithdraw()`: Emergency fund recovery (owner only)

## Deployment Info Structure

After deployment, `deployments/{network}.json` contains:

```json
{
  "network": "mumbai",
  "contractAddress": "0x...",
  "governanceWallet": "0x...",
  "deployedAt": "2026-02-11T...",
  "blockNumber": 12345678
}
```

## Gas Costs (Approximate)

| Operation | Gas (Mumbai) | Cost @ 20 Gwei |
|-----------|--------------|----------------|
| Deployment | ~1,500,000 | ~0.03 MATIC |
| Create Ride | ~150,000 | ~0.003 MATIC |
| Complete Ride | ~100,000 | ~0.002 MATIC |
| Cancel Ride | ~50,000 | ~0.001 MATIC |

## Troubleshooting

### "Insufficient funds for gas"
- Get testnet MATIC from [Polygon Faucet](https://faucet.polygon.technology/)
- For mainnet, ensure you have enough MATIC in your wallet

### "Invalid nonce"
Try resetting your account:
```bash
npx hardhat clean
```

### "Contract verification failed"
Manually verify:
```bash
npx hardhat verify --network mumbai <ADDRESS> <GOVERNANCE_WALLET>
```

### "Transaction underpriced"
Increase gas price in `hardhat.config.js`:
```javascript
mumbai: {
  gasPrice: 30000000000 // Increase from 20 to 30 gwei
}
```

## Network Configuration

### Mumbai Testnet
- **Chain ID**: 80001
- **RPC URL**: https://rpc-mumbai.maticvigil.com/
- **Explorer**: https://mumbai.polygonscan.com/
- **Faucet**: https://faucet.polygon.technology/

### Polygon Mainnet
- **Chain ID**: 137
- **RPC URL**: https://polygon-rpc.com/
- **Explorer**: https://polygonscan.com/

## Security Considerations

1. **Private Keys**: Never commit `.env` files or expose private keys
2. **Testing**: Always test on Mumbai before deploying to mainnet
3. **Auditing**: Consider professional audit before production use
4. **Governance**: Use a multisig wallet for governance in production
5. **Upgrades**: Contract is NOT upgradeable - test thoroughly before deployment

## Integration with Apps

After deployment, the contract works with:

- `shared/services/Web3PaymentService.js` - Handles escrow operations
- `shared/services/GovernanceService.js` - Calculates dynamic fees
- `shared/services/PresenceValidationService.js` - Generates completion signatures

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Polygon Documentation](https://docs.polygon.technology/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Solidity Documentation](https://docs.soliditylang.org/)

## Support

For issues related to:
- Smart contract: Check `test/ZubiEscrow.test.js` for usage examples
- Deployment: Review `scripts/deploy-contract.js`
- Configuration: Check `hardhat.config.js`
