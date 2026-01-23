# Referral Program Module

A comprehensive referral program implementation for the quest-service application that allows players to invite friends and earn rewards.

## Features

- ✅ **Unique Referral Code Generation**: Each player gets a unique referral code
- ✅ **Referral Tracking**: Complete tracking of referral relationships
- ✅ **Invite Link Generation**: Automatic generation of shareable invite links
- ✅ **Reward Distribution**: Rewards for both referrer and referee
- ✅ **Referral Leaderboard**: Rankings based on total referrals, active referrals, or rewards earned
- ✅ **Analytics Dashboard**: Comprehensive analytics and metrics

## Database Schema

### Tables

1. **referral_codes**: Stores unique referral codes for each user
   - `id` (UUID, Primary Key)
   - `code` (VARCHAR, Unique) - The referral code
   - `userId` (UUID, Foreign Key to users)
   - `totalReferrals` (INT) - Total number of referrals
   - `activeReferrals` (INT) - Number of active/pending referrals
   - `totalRewardsEarned` (INT) - Total rewards earned
   - `isActive` (BOOLEAN) - Whether the code is active
   - `expiresAt` (TIMESTAMP, Optional) - Expiration date

2. **referrals**: Tracks referral relationships
   - `id` (UUID, Primary Key)
   - `referrerId` (UUID, Foreign Key to users) - User who referred
   - `refereeId` (UUID, Foreign Key to users) - User who was referred
   - `referralCodeId` (UUID, Foreign Key to referral_codes)
   - `status` (ENUM: pending, completed, rewarded, cancelled)
   - `referrerReward` (INT) - Reward amount for referrer
   - `refereeReward` (INT) - Reward amount for referee
   - `referrerRewarded` (BOOLEAN) - Whether referrer has been rewarded
   - `refereeRewarded` (BOOLEAN) - Whether referee has been rewarded
   - `metadata` (JSONB) - Additional metadata (IP, user agent, source, campaign)

## API Endpoints

### Referral Code Management

- `POST /referrals/code` - Generate or get referral code for current user
- `GET /referrals/code` - Get referral code for current user
- `GET /referrals/invite-link` - Get invite link for current user

### Referral Operations

- `POST /referrals/use` - Use a referral code (during registration)
- `GET /referrals/stats` - Get referral statistics for current user
- `GET /referrals/my-referrals` - Get all referrals for current user
- `GET /referrals/:id` - Get specific referral by ID
- `POST /referrals/:id/complete` - Mark a referral as completed

### Leaderboard

- `GET /referrals/leaderboard/all` - Get referral leaderboard
  - Query params: `type` (total_referrals | active_referrals | rewards_earned), `limit`, `offset`
- `GET /referrals/leaderboard/rank` - Get current user's rank
  - Query params: `type` (optional)

### Analytics

- `GET /referrals/analytics/dashboard` - Get dashboard summary for current user
- `GET /referrals/analytics/overview` - Get comprehensive analytics
  - Query params: `startDate`, `endDate`, `period` (day | week | month | year | all_time), `userId`

## Usage Examples

### Generate Referral Code

```bash
POST /referrals/code
Authorization: Bearer <token>

Response:
{
  "id": "uuid",
  "code": "ABC12345",
  "userId": "user-uuid",
  "totalReferrals": 0,
  "activeReferrals": 0,
  "totalRewardsEarned": 0,
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### Get Invite Link

```bash
GET /referrals/invite-link
Authorization: Bearer <token>

Response:
{
  "inviteLink": "http://localhost:3000/signup?ref=ABC12345"
}
```

### Use Referral Code

```bash
POST /referrals/use
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "ABC12345",
  "source": "email",
  "campaign": "winter2025"
}

Response:
{
  "id": "referral-uuid",
  "referrerId": "referrer-uuid",
  "refereeId": "referee-uuid",
  "status": "pending",
  "referrerReward": 100,
  "refereeReward": 50,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### Get Leaderboard

```bash
GET /referrals/leaderboard/all?type=total_referrals&limit=10&offset=0

Response:
{
  "entries": [
    {
      "userId": "uuid",
      "username": "player1",
      "code": "ABC12345",
      "totalReferrals": 50,
      "activeReferrals": 10,
      "completedReferrals": 40,
      "totalRewardsEarned": 4000,
      "rank": 1
    }
  ],
  "total": 100,
  "type": "total_referrals"
}
```

## Reward System

### Default Rewards

- **Referrer Reward**: 100 points (configurable)
- **Referee Reward**: 50 points (configurable)

### Reward Distribution

Rewards are distributed when a referral is marked as completed. Currently, rewards are added to the user's experience and total score. In production, this should integrate with the economy-service microservice.

## Migration

To apply the database migration:

```bash
npm run build
npx typeorm migration:run -d dist/config/orm-config.js
```

The migration file is located at: `src/migrations/CreateReferralTables.ts`

## Integration

The referral module is automatically integrated into the main application via `app.module.ts`. It requires:

- TypeORM with PostgreSQL
- User entity from `users` module
- JWT authentication (for protected endpoints)

## Future Enhancements

- [ ] Integration with economy-service for reward distribution
- [ ] Email notifications for referral events
- [ ] Referral code expiration and renewal
- [ ] Multi-tier referral system
- [ ] Referral code customization
- [ ] Fraud detection and prevention
- [ ] Referral code analytics per campaign

## Acceptance Criteria Status

✅ **Unique referral codes generated per player** - Implemented with unique code generation  
✅ **Referrals tracked accurately** - Complete tracking with status management  
✅ **Rewards distributed to both referrer and referee** - Reward distribution implemented  
✅ **Referral metrics accessible** - Analytics dashboard and endpoints available
