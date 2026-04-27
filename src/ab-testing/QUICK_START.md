# Quick Start: A/B Testing & Feature Flags

## 1. Installation
The service is already integrated. Just run migrations:

```bash
npm run typeorm migration:run
```

## 2. Basic Usage

### Create an Experiment
```typescript
// In your service
import { ExperimentsService } from './ab-testing/experiments.service';

@Injectable()
export class YourService {
  constructor(private readonly experimentsService: ExperimentsService) {}

  async testFeature() {
    // Assign user to variant
    const assignment = await this.experimentsService.assignVariant('user123');
    
    if (assignment?.variantName === 'variant_a') {
      // Show new feature
    } else {
      // Show old feature (control)
    }
  }
}
```

### Use Feature Flags
```typescript
async checkFeature(userId: string) {
  const playerContext = {
    userId,
    isPremium: await this.isPremium(userId),
    accountAgeDays: await this.getAccountAge(userId),
  };
  
  return this.experimentsService.evaluateFlag('new_feature', playerContext);
}
```

## 3. API Quick Reference

### Admin Endpoints (Require AdminGuard)
```bash
# Create experiment
POST /experiments
{
  "name": "test_name",
  "variants": [{"name": "control"}, {"name": "variant"}],
  "traffic_split_pct": 50
}

# Create flag
POST /flags
{
  "key": "feature_key",
  "enabled": true,
  "rollout_pct": 25,
  "target_cohort": "premium"
}

# Update flag
PATCH /flags/:key
{
  "rollout_pct": 50
}
```

### Public Endpoints
```bash
# Assign variant
GET /experiments/assign/:userId

# Track conversion
POST /experiments/:id/track
{
  "user_id": "user123",
  "event_type": "event_name"
}

# Get results
GET /experiments/:id/results

# Evaluate flag
GET /flags/:key

# List flags
GET /flags
```

## 4. Common Patterns

### Pattern 1: Gradual Rollout
```typescript
// Start with 10% rollout, increase gradually
const enabled = await experimentsService.evaluateFlag('new_ui', playerContext);
```

### Pattern 2: Premium-Only Features
```typescript
// Set target_cohort to "premium" when creating flag
// Only premium users will see it
```

### Pattern 3: New User Onboarding
```typescript
// Set target_cohort to "new_users"
// Only users with accountAgeDays <= 7 will see it
```

### Pattern 4: A/B Test with Tracking
```typescript
// 1. Assign variant
const assignment = await experimentsService.assignVariant(userId);

// 2. Show variant
if (assignment?.variantName === 'new_design') {
  showNewDesign();
}

// 3. Track conversion
await experimentsService.trackConversion(assignment.experimentId, {
  user_id: userId,
  event_type: 'purchase_completed',
});
```

## 5. Default Flags
After migration, these flags exist:

| Flag | Rollout | Cohort | Enabled |
|------|---------|--------|---------|
| `new_puzzle_ui` | 10% | all | false |
| `premium_rewards` | 100% | premium | true |
| `tutorial_v2` | 0% | all | false |
| `social_features` | 50% | all | true |
| `mobile_optimizations` | 100% | all | true |

## 6. Monitoring
Check experiment results:
```bash
GET /experiments/{experiment_id}/results
```
Returns conversion rates and statistical significance.

## 7. Best Practices

1. **Start small**: 10% rollout for new features
2. **Track conversions**: Always track key metrics
3. **Check significance**: Wait for statistical significance before declaring winner
4. **Use cohorts**: Target features to appropriate user groups
5. **Be deterministic**: Same user always gets same result