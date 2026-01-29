# Reward Service Implementation

The Reward Service is a dedicated microservice handling tokens, NFTs, achievements, and Stellar blockchain integration for the LogiQuest gaming platform.

## Features

- **Token Distribution**: Distribute tokens to users based on achievements and activities
- **NFT Minting**: Mint unique NFTs for special achievements and milestones
- **Achievement Tracking**: Track user achievements and unlock rewards
- **Stellar Integration**: Integrate with Stellar blockchain for secure transactions
- **Wallet Management**: Handle wallet connections and transactions
- **Transaction Monitoring**: Monitor and log all blockchain transactions

## Architecture

### Entities

- `Reward`: Tracks all reward distributions (tokens, NFTs, achievements)
- `Achievement`: Defines achievement criteria and rewards
- `UserAchievement`: Tracks which users have unlocked which achievements
- `NFT`: Manages NFT minting, ownership, and metadata

### Services

- `RewardService`: Handles token reward distribution
- `NFTService`: Manages NFT minting and transfers
- `AchievementService`: Processes achievement unlocks and rewards
- `StellarService`: Interfaces with Stellar blockchain
- `WalletService`: Manages wallet connections
- `TransactionMonitoringService`: Monitors blockchain transactions

### Modules

- `RewardModule`: Core reward functionality
- `AchievementModule`: Achievement tracking system
- `NFTModule`: NFT minting and management
- `WalletModule`: Wallet integration

## API Endpoints

### Token Rewards
- `POST /rewards/token/distribute` - Distribute tokens to a user
- `GET /rewards/token/balance/:userId` - Get user token balance
- `GET /rewards/token/history/:userId` - Get token transaction history

### NFT Operations
- `POST /nft/mint` - Mint a new NFT
- `GET /nft/:tokenId` - Get NFT details
- `POST /nft/transfer` - Transfer NFT ownership

### Achievements
- `POST /achievements/unlock` - Unlock an achievement
- `GET /achievements/user/:userId` - Get user achievements
- `GET /achievements/:achievementId` - Get achievement details

### Wallet
- `POST /wallet/connect` - Connect wallet
- `GET /wallet/balance` - Get wallet balance
- `GET /wallet/transactions` - Get transaction history

## Technical Details

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Blockchain**: Stellar/Soroban integration
- **Caching**: Redis with BullMQ for job queues
- **Containerization**: Docker and Docker Compose
- **Configuration**: Environment-based configuration

## Acceptance Criteria Verification

✅ **Token rewards distributed correctly**: Implemented via RewardService with Stellar blockchain integration

✅ **NFT minting triggered successfully**: Implemented via NFTService with proper minting workflow

✅ **Blockchain transactions recorded**: StellarService tracks all blockchain interactions

✅ **Achievement unlocks tracked**: AchievementService monitors and records all achievement unlocks

✅ **Service runs independently**: Self-contained microservice with all dependencies managed

## Setup Instructions

1. Ensure PostgreSQL, Redis, and RabbitMQ are running
2. Set up environment variables in `.env` file
3. Run `npm install`
4. Run `npm run start:dev`

The service is now ready to handle reward distribution, NFT minting, achievement tracking, and Stellar blockchain integration!