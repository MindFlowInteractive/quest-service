# Blockchain Events Service

A background service that listens to Soroban contract events from the quest-contract ecosystem and syncs relevant on-chain state into the PostgreSQL database.

## Features

- **Background Polling**: Automatically queries Stellar Horizon `/events` endpoint every 30 seconds
- **Idempotent Processing**: Prevents duplicate state updates by checking transaction hashes
- **Typed Event Handlers**: Handles specific event types with dedicated logic
- **Dead-Letter Queue**: Failed events are stored for manual retry without blocking sync
- **Admin Endpoints**: Status monitoring and event replay functionality
- **Comprehensive Testing**: Full test coverage for all components

## Supported Event Types

1. **RewardClaimed** - Updates player balance cache
2. **AchievementUnlocked** - Updates player achievements and unlocks rewards
3. **NFTMinted** - Updates NFT ownership and indexes metadata
4. **TournamentCompleted** - Updates tournament results and distributes prizes
5. **StakeDeposited** - Updates player stake balances and calculates rewards

## Architecture

### Entities

#### OnChainEvent
- `contractAddress`: The contract that emitted the event
- `eventType`: Type of event (enum)
- `payload`: Event data in JSONB format
- `ledger`: Ledger number where event occurred
- `txHash`: Transaction hash (unique constraint)
- `status`: Processing status (pending, processed, failed, retrying)
- `processedAt`: Timestamp when event was processed

#### DeadLetterEvent
- Stores failed events for manual retry
- Includes error messages and stack traces
- Tracks retry attempts and resolution status

### Services

#### BlockchainEventsService
- Main polling service with `@Cron` decorator
- Queries Stellar Horizon API for events
- Handles idempotent processing
- Manages dead-letter queue

#### EventHandlersService
- Typed handlers for each event type
- Updates local database state
- Triggers notifications and side effects

### API Endpoints

#### GET `/admin/sync/status`
Returns sync status including:
- Last synced ledger
- Events processed today
- Error count
- Registered contract addresses

#### POST `/admin/sync/replay`
Triggers replay of events from a specific ledger range:
- `fromLedger` (required): Starting ledger number
- `toLedger` (optional): Ending ledger number

## Configuration

Add the following environment variables:

```env
# Stellar Horizon API endpoint
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

# Stellar network (testnet or mainnet)
STELLAR_NETWORK=testnet

# Comma-separated contract addresses to monitor
QUEST_CONTRACT_ADDRESSES=contract1,contract2,contract3

# Polling interval in seconds (default: 30)
BLOCKCHAIN_EVENTS_POLL_INTERVAL=30

# Maximum retry attempts (default: 3)
BLOCKCHAIN_EVENTS_MAX_RETRIES=3
```

## Database Schema

The service creates two tables:

1. `onchain_events` - Stores all processed events
2. `dead_letter_events` - Stores failed events for retry

Both tables include comprehensive indexing for optimal query performance.

## Installation

1. The module is automatically registered in `app.module.ts`
2. Run the database migration: `npm run migration:run`
3. Configure environment variables
4. Restart the application

## Monitoring

- Check sync status via `/admin/sync/status` endpoint
- Monitor logs for polling activity and errors
- Use `/admin/sync/replay` for manual event reprocessing
- Check dead-letter queue for failed events

## Testing

Comprehensive test suite covering:
- Polling cycle functionality
- Idempotent processing
- Event handler logic
- Error handling and dead-letter queueing
- Admin endpoint functionality
- Event replay from ledger ranges

Run tests with: `npm test -- blockchain-events`

## Performance

- Events synced within 60 seconds of on-chain confirmation
- Efficient database queries with proper indexing
- Non-blocking processing with dead-letter queue
- Configurable polling intervals and retry limits
