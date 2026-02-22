# Energy/Stamina System

## Overview

The Energy/Stamina system limits puzzle attempts and regenerates over time, with token-based refills and social features. This system encourages strategic gameplay while providing monetization opportunities and social engagement.

## Features

### ✅ Core Energy System
- **Energy Tracking**: Each user has current energy, maximum energy, and regeneration settings
- **Energy Consumption**: Puzzles consume energy based on type and difficulty
- **Time-based Regeneration**: Energy regenerates automatically over time
- **Maximum Energy Cap**: Configurable maximum energy limits

### ✅ Token-based Refills
- **Token Integration**: Users can spend tokens to refill energy instantly
- **Configurable Rates**: 1 token = 10 energy (configurable)
- **Refill Limits**: Maximum energy per refill to prevent abuse

### ✅ Energy Gift System
- **Send Gifts**: Users can send energy gifts to friends
- **Daily Limits**: 5 gifts sent, 10 gifts received per day
- **Gift Expiration**: Gifts expire after 24 hours
- **Gift Acceptance**: Recipients can accept gifts when needed

### ✅ Energy Boost System
- **Boost Types**: Regeneration speed, max energy increase, consumption reduction, instant refill
- **Temporary Effects**: Time-limited boosts with expiration
- **Rarity System**: Common, rare, epic, legendary boosts

### ✅ Notification System
- **Energy Full**: Notify when energy is fully restored
- **Gift Notifications**: Alert when receiving energy gifts
- **Low Energy**: Optional notifications when energy is low

### ✅ Analytics & History
- **Transaction History**: Complete log of all energy transactions
- **Energy Statistics**: Current status, regeneration times, gift counts
- **Performance Tracking**: Monitor energy consumption patterns

## API Endpoints

### Energy Status
```http
GET /energy/status
```
Returns current energy status, regeneration info, and gift counts.

### Energy Consumption
```http
POST /energy/consume
{
  "amount": 10,
  "relatedEntityId": "puzzle-123",
  "relatedEntityType": "puzzle",
  "metadata": { "puzzleType": "code", "difficulty": "hard" }
}
```

### Token Refill
```http
POST /energy/refill
{
  "tokensToSpend": 3
}
```

### Gift System
```http
POST /energy/gifts/send
{
  "recipientId": "user-456",
  "energyAmount": 15,
  "message": "Good luck with your puzzles!"
}

GET /energy/gifts/pending
POST /energy/gifts/{giftId}/accept
```

### Energy Boosts
```http
POST /energy/boosts/apply
{
  "boostId": "boost-123"
}
```

### History & Analytics
```http
GET /energy/history?limit=50&offset=0
```

## Database Schema

### UserEnergy Table
- `id`: Primary key
- `user_id`: Foreign key to users table
- `current_energy`: Current energy amount
- `max_energy`: Maximum energy capacity
- `last_regeneration`: Last regeneration timestamp
- `regeneration_rate`: Energy points per interval
- `regeneration_interval_minutes`: Minutes between regeneration
- `energy_gifts_sent_today`: Daily gift counter
- `energy_gifts_received_today`: Daily gift counter
- `boost_multiplier`: Active boost multiplier
- `boost_expires_at`: Boost expiration time

### EnergyTransaction Table
- `id`: Primary key
- `user_id`: Foreign key to users
- `transaction_type`: Enum (consumption, regeneration, token_refill, gift_sent, gift_received, boost_applied)
- `amount`: Energy change amount
- `energy_before`: Energy before transaction
- `energy_after`: Energy after transaction
- `related_entity_id`: Related puzzle/gift/boost ID
- `metadata`: Additional transaction data

### EnergyGift Table
- `id`: Primary key
- `sender_id`: Gift sender user ID
- `recipient_id`: Gift recipient user ID
- `energy_amount`: Energy amount in gift
- `status`: Enum (pending, accepted, expired)
- `expires_at`: Gift expiration time
- `message`: Optional gift message

### EnergyBoost Table
- `id`: Primary key
- `name`: Boost name
- `boost_type`: Enum (regeneration_speed, max_energy_increase, consumption_reduction, instant_refill)
- `effect_value`: Boost effect amount/multiplier
- `duration_minutes`: Boost duration (null for permanent)
- `token_cost`: Cost in tokens
- `rarity`: Boost rarity level

## Configuration

Environment variables for customizing the energy system:

```env
# Default energy settings
ENERGY_DEFAULT_MAX=100
ENERGY_DEFAULT_CURRENT=100

# Regeneration settings
ENERGY_REGEN_RATE=1
ENERGY_REGEN_INTERVAL_MINUTES=30

# Gift system settings
ENERGY_MAX_GIFTS_SENT_PER_DAY=5
ENERGY_MAX_GIFTS_RECEIVED_PER_DAY=10
ENERGY_DEFAULT_GIFT_AMOUNT=10
ENERGY_MAX_GIFT_AMOUNT=50
ENERGY_GIFT_EXPIRATION_HOURS=24

# Token refill settings
ENERGY_PER_TOKEN=10
ENERGY_MAX_PER_REFILL=50
ENERGY_MAX_TOKENS_PER_REFILL=10

# Puzzle energy costs
ENERGY_COST_MULTIPLE_CHOICE=5
ENERGY_COST_FILL_BLANK=8
ENERGY_COST_DRAG_DROP=10
ENERGY_COST_CODE=15
ENERGY_COST_VISUAL=12
ENERGY_COST_LOGIC_GRID=20

# Difficulty multipliers
ENERGY_DIFFICULTY_EASY_MULTIPLIER=0.8
ENERGY_DIFFICULTY_MEDIUM_MULTIPLIER=1.0
ENERGY_DIFFICULTY_HARD_MULTIPLIER=1.3
ENERGY_DIFFICULTY_EXPERT_MULTIPLIER=1.6

# Notifications
ENERGY_ENABLE_NOTIFICATIONS=true
ENERGY_NOTIFY_WHEN_FULL=true
ENERGY_NOTIFY_WHEN_LOW=true
ENERGY_LOW_THRESHOLD=20
```

## Integration with Puzzle System

The energy system is integrated with the puzzle engine:

1. **Puzzle Creation**: Energy is consumed when creating/starting puzzles
2. **Energy Cost Calculation**: Based on puzzle type and difficulty
3. **Insufficient Energy**: Puzzle creation fails with energy status
4. **Energy Feedback**: Users see remaining energy after puzzle attempts

### Energy Costs by Puzzle Type
- Multiple Choice: 5 energy
- Fill in Blank: 8 energy
- Drag and Drop: 10 energy
- Code Puzzle: 15 energy
- Visual Puzzle: 12 energy
- Logic Grid: 20 energy

### Difficulty Multipliers
- Easy: 0.8x energy cost
- Medium: 1.0x energy cost
- Hard: 1.3x energy cost
- Expert: 1.6x energy cost

## Automated Tasks

### Energy Regeneration (Every 5 minutes)
- Checks all users with energy < max energy
- Calculates regeneration based on time elapsed
- Updates energy and creates regeneration transactions
- Sends notifications when energy is full

### Gift Cleanup (Daily at midnight)
- Marks expired gifts as expired
- Cleans up old transaction data (optional)
- Resets daily gift counters

## Testing

### Unit Tests
- Energy consumption logic
- Regeneration calculations
- Gift system functionality
- Boost application
- Edge cases and error handling

### Integration Tests
- Full API endpoint testing
- Database transaction integrity
- Notification system integration
- Cron job functionality
- Multi-user scenarios

Run tests:
```bash
npm run test src/energy/energy.service.spec.ts
npm run test:e2e src/energy/energy.integration.spec.ts
```

## Monitoring & Analytics

### Key Metrics
- Average energy consumption per user
- Token refill conversion rates
- Gift system engagement
- Energy regeneration patterns
- Boost usage statistics

### Performance Considerations
- Database indexing on user_id and timestamps
- Efficient regeneration queries
- Transaction batching for bulk operations
- Caching for frequently accessed energy data

## Future Enhancements

### Planned Features
- **Energy Leaderboards**: Top energy savers/spenders
- **Seasonal Energy Events**: Special regeneration rates
- **Energy Achievements**: Rewards for energy milestones
- **Advanced Boost System**: Stackable boosts, combo effects
- **Energy Trading**: User-to-user energy marketplace

### Technical Improvements
- **Real-time Updates**: WebSocket energy status updates
- **Predictive Analytics**: ML-based energy usage predictions
- **Advanced Caching**: Redis integration for energy data
- **Microservice Architecture**: Separate energy service

## Troubleshooting

### Common Issues

1. **Energy Not Regenerating**
   - Check cron job status
   - Verify regeneration interval settings
   - Check database timestamps

2. **Gift System Not Working**
   - Verify user relationships
   - Check daily limits
   - Confirm gift expiration times

3. **Token Refills Failing**
   - Check token balance integration
   - Verify refill limits
   - Check transaction rollback logs

### Debug Commands
```bash
# Check energy status for user
curl -H "Authorization: Bearer <token>" /energy/status

# View recent energy transactions
curl -H "Authorization: Bearer <token>" /energy/history?limit=10

# Check pending gifts
curl -H "Authorization: Bearer <token>" /energy/gifts/pending
```

## Security Considerations

- **Rate Limiting**: Prevent energy system abuse
- **Input Validation**: Validate all energy-related inputs
- **Transaction Integrity**: Atomic operations for energy changes
- **Anti-Cheat**: Monitor suspicious energy patterns
- **Gift Limits**: Prevent energy farming through gifts

## Conclusion

The Energy/Stamina system provides a comprehensive solution for managing user engagement, monetization, and social interaction within the quest service. It balances gameplay progression with strategic resource management while offering multiple paths for energy acquisition and social engagement.