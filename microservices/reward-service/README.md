# Reward Service

A microservice for handling token rewards, NFT minting, achievement tracking, and Stellar blockchain integration.

## Features

- **Token Distribution**: Distribute tokens to users based on achievements and activities
- **NFT Minting**: Mint unique NFTs for special achievements and milestones
- **Achievement Tracking**: Track user achievements and unlock rewards
- **Stellar Integration**: Integrate with Stellar blockchain for secure transactions
- **Wallet Management**: Handle wallet connections and transactions
- **Transaction Monitoring**: Monitor and log all blockchain transactions

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Blockchain**: Stellar/Soroban
- **Messaging**: RabbitMQ
- **Caching**: Redis
- **Queue Processing**: BullMQ

## Getting Started

### Prerequisites

- Node.js >= 18
- Docker and Docker Compose
- PostgreSQL
- Redis
- RabbitMQ

### Installation

1. Clone the repository
2. Navigate to the reward-service directory:
   ```bash
   cd microservices/reward-service
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
5. Update the `.env` file with your configuration

### Running the Service

#### Development Mode

```bash
npm run start:dev
```

#### Production Mode

```bash
npm run build
npm run start:prod
```

#### Using Docker

```bash
docker-compose up --build
```

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

## Environment Variables

See `.env.example` for all available configuration options.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT