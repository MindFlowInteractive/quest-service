# Deployment Guide for CoCreation Contract

## Prerequisites

1. Node.js and npm installed
2. Ethereum wallet with testnet ETH (Sepolia or Goerli)
3. RPC endpoint URL (e.g., from Infura, Alchemy, or QuickNode)
4. Private key for the wallet (NEVER commit this to git)

## Installation

```bash
cd contracts/puzzle_co_creation
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in the environment variables:
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
GOERLI_RPC_URL=https://goerli.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here (without 0x prefix)
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

## Get Testnet ETH

Before deploying, ensure you have testnet ETH:

- **Sepolia**: https://sepoliafaucet.com or https://faucet.quicknode.com/ethereum/sepolia
- **Goerli**: https://goerlifaucet.com or https://faucet.quicknode.com/ethereum/goerli

## Deployment Steps

### 1. Compile the Contract

```bash
npm run compile
```

### 2. Run Tests (Optional but Recommended)

```bash
npm test
```

### 3. Deploy to Local Network (for testing)

```bash
npm run deploy:local
```

### 4. Deploy to Sepolia Testnet

```bash
npm run deploy:sepolia
```

Expected output:
```
Deploying CoCreation contract...
CoCreation deployed to: 0x...
Initial coCreationCounter: 0

Deployment successful!
Contract address: 0x...
```

### 5. Deploy to Goerli Testnet

```bash
npm run deploy:goerli
```

## Contract Verification

After deployment, verify the contract on Etherscan:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

Or for Goerli:
```bash
npx hardhat verify --network goerli <CONTRACT_ADDRESS>
```

## Post-Deployment Checklist

- [ ] Save the deployed contract address
- [ ] Verify the contract on Etherscan
- [ ] Test basic functions on the testnet:
  - Initiate a co-creation
  - Sign as a creator
  - Publish the puzzle
  - Distribute royalties
- [ ] Add the contract address to your backend configuration
- [ ] Monitor contract events using Etherscan or a block explorer

## Integration with Backend

To integrate with your NestJS backend:

1. Add the contract address to your environment variables:
```env
CO_CREATION_CONTRACT_ADDRESS=0x...
```

2. Use ethers.js or web3.js to interact with the contract from your backend:
```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(
  process.env.CO_CREATION_CONTRACT_ADDRESS,
  CoCreationABI,
  provider
);
```

## Security Notes

- **NEVER** commit your private key to version control
- **NEVER** use mainnet private keys for testnet deployment
- Always verify the contract address before sending funds
- Test thoroughly on testnet before considering mainnet deployment
- Consider using a hardware wallet for production deployments

## Troubleshooting

### "Insufficient funds" error
- Ensure you have enough testnet ETH for gas fees
- Gas fees typically cost 0.01-0.05 ETH on testnet

### "Nonce too low" error
- This happens when you have pending transactions
- Wait for pending transactions to confirm or reset your account nonce

### "Network not found" error
- Check your RPC URL in `.env`
- Ensure the RPC endpoint is accessible

### Contract verification fails
- Ensure you have the correct Etherscan API key
- Check that the constructor arguments match (none for this contract)
- Wait a few blocks after deployment before verifying

## Gas Optimization

The contract uses:
- Solidity 0.8.20 with optimizer enabled (200 runs)
- Efficient storage patterns
- Minimal external calls

Estimated gas costs:
- Deployment: ~1,500,000 gas
- initiate: ~150,000 gas
- sign: ~50,000 gas
- publish: ~60,000 gas
- distributeRoyalty: ~80,000 gas per creator

## Next Steps

After successful testnet deployment:

1. Monitor the contract on Etherscan
2. Set up event monitoring for CoCreationInitiated, SignatureAdded, PuzzlePublished, RoyaltySplit
3. Integrate with your backend API
4. Consider adding multi-sig for admin functions if needed
5. Plan for mainnet deployment after thorough testing
