# A/B Testing and Feature Flag Service

A comprehensive A/B testing framework and feature flag system for the quest-service platform.

## Features

### Experiments

- Create experiments with multiple variants
- Deterministic user assignment (same user → same variant)
- Traffic splitting (percentage-based)
- Conversion tracking
- Statistical significance calculation (z-score)
- Results aggregation with conversion rates

### Feature Flags

- Gradual rollout with percentages
- Target cohorts: ALL, PREMIUM, NEW_USERS
- Deterministic evaluation (same user → same result)
- Admin management

## API Endpoints

### Experiments

#### `POST /experiments`
Create a new experiment.

**Request Body:**
```json
{
  "name": "puzzle_ui_v2",
  "variants": [
    {"name": "control", "description": "Current UI"},
    {"name": "variant_a", "description": "New sidebar"}
  ],
  "traffic_split_pct": 50
}
```

#### `GET /experiments/assign/:userId`
Assign a user to a variant deterministically.

**Response:**
```json
{
  "experimentId": "uuid",
  "variantName": "control"
}
```
or `null` if user is outside traffic split.

#### `POST /experiments/:id/track`
Track a conversion event.

**Request Body:**
```json
{
  "user_id": "user123",
  "event_type": "puzzle_completed"
}
```

#### `GET /experiments/:id/results`
Get experiment results with statistical significance.

**Response:**
```json
{
  "experiment_id": "uuid",
  "results": [
    {
      "variant": "control",
      "total_users": 100,
      "conversions": 25,
      "conversion_rate": 0.25
    }
  ],
  "significance": {
    "z_score": 1.96,
    "significant": true
  }
}
```

### Feature Flags

#### `POST /flags`
Create a new feature flag.

**Request Body:**
```json
{
  "key": "new_reward_system",
  "enabled": true,
  "rollout_pct": 25,
  "target_cohort": "premium"
}
```

#### `GET /flags/:key`
Evaluate a feature flag for the authenticated user.

**Response:** `true` or `false`

#### `PATCH /flags/:key`
Update a feature flag.

**Request Body:**
```json
{
  "enabled": false,
  "rollout_pct": 50,
  "target_cohort": "all"
}
```

#### `GET /flags`
List all feature flags.

## Database Schema

### Tables
1. `experiments` - Experiment definitions
2. `experiment_conversions` - Conversion events
3. `experiment_assignments` - User-variant assignments
4. `feature_flags` - Feature flag definitions

### Migration
Run the migration to create tables:
```bash
npm run typeorm migration:run
```

## Usage Example

```typescript
// In another service
import { ExperimentsService } from './ab-testing/experiments.service';

@Injectable()
export class PuzzleService {
  constructor(private readonly experimentsService: ExperimentsService) {}

  async getPuzzleUI(userId: string) {
    const assignment = await this.experimentsService.assignVariant(userId);
    
    if (assignment?.variantName === 'variant_a') {
      return newUIVersion();
    }
    
    return defaultUIVersion();
  }

  async isFeatureEnabled(userId: string, featureKey: string) {
    const playerContext = {
      userId,
      isPremium: await this.isPremiumUser(userId),
      accountAgeDays: await this.getAccountAge(userId),
    };
    
    return this.experimentsService.evaluateFlag(featureKey, playerContext);
  }
}
```

## Deterministic Assignment

The system uses MD5 hash for deterministic assignment:
- Same user + same experiment → same variant
- Same user + same flag key → same flag result
- Traffic split respected consistently

## Statistical Significance

Uses two-proportion z-test:
- |z| ≥ 1.96 = 95% confidence (significant)
- Calculated when comparing two variants
- Returns z-score and significance flag

## Default Feature Flags

The migration creates default flags:
- `new_puzzle_ui` (10% rollout)
- `premium_rewards` (100% for premium)
- `tutorial_v2` (disabled)
- `social_features` (50% rollout)
- `mobile_optimizations` (100% rollout)