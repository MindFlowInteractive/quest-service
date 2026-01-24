# Economy Service

A NestJS microservice for managing energy/stamina systems, hint purchases, in-game shop, and transactions.

## Features

- **Energy Management**: Automatic energy regeneration with configurable rates
- **Shop System**: Manage in-game items with different types (hints, power-ups, cosmetics)
- **Transaction Ledger**: Complete transaction history and balance tracking
- **Payment Integration**: Support for multiple payment providers (Stripe, PayPal)
- **Docker Support**: Fully containerized for easy deployment

## API Endpoints

### Energy Management

- `GET /energy/:userId` - Get user's current energy
- `POST /energy/:userId/consume` - Consume energy
- `POST /energy/:userId/add` - Add energy
- `POST /energy/:userId/refill` - Refill energy to max
- `GET /energy/:userId/status` - Get regeneration status

### Shop Management

- `GET /shop` - Get all shop items
- `POST /shop` - Create new shop item
- `GET /shop/:id` - Get specific shop item
- `PUT /shop/:id` - Update shop item
- `DELETE /shop/:id` - Delete shop item
- `POST /shop/:shopItemId/purchase` - Purchase shop item

### Transactions

- `GET /transactions/user/:userId` - Get user transactions
- `POST /transactions` - Create transaction
- `GET /transactions/:id` - Get transaction details
- `POST /transactions/:id/complete` - Complete transaction
- `POST /transactions/:id/refund` - Refund transaction

### Payment

- `GET /payment/providers` - Get available payment providers
- `POST /payment/:provider/process` - Process payment
- `POST /payment/:provider/refund` - Refund payment

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker (optional)

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Run database migrations:
   ```bash
   npm run migration:run
   ```

### Running with Docker

1. Build and start services:
   ```bash
   docker-compose up --build
   ```

The service will be available at `http://localhost:3002`

### Running Locally

1. Start PostgreSQL database
2. Run the service:
   ```bash
   npm run start:dev
   ```

## Configuration

### Energy System

- Default max energy: 100
- Regeneration rate: 300 energy per interval
- Regeneration interval: 60 seconds
- Automatic regeneration runs every 30 seconds

### Shop Items

- Types: HINT, POWER_UP, COSMETIC, ENERGY_REFILL
- Status: ACTIVE, INACTIVE, LIMITED
- Purchase limits and expiration support

### Payment Providers

- Stripe (test mode by default)
- PayPal (sandbox mode by default)
- Extensible provider system

## Database Schema

The service uses the following main entities:

- `user_energy` - User energy/stamina tracking
- `shop_items` - Shop item catalog
- `transactions` - Transaction ledger

## Development

### Running Tests

```bash
npm test
```

### Code Formatting

```bash
npm run format
```

### Type Checking

```bash
npm run type-check
```

## Environment Variables

See `.env.example` for all available configuration options.

## License

UNLICENSED
