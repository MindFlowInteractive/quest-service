# Quest Chain System API Documentation

## Overview
The Quest Chain system provides a comprehensive framework for creating progressive puzzle sequences with story elements, unlock conditions, branching paths, and reward systems.

## Base URL
`/quest-chains`

## Quest Chain Management

### Create Quest Chain
```http
POST /quest-chains
```

**Request Body:**
```json
{
  "name": "The Mystery of Blackwood Manor",
  "description": "Solve the mysteries of the haunted Blackwood Manor",
  "status": "active",
  "story": {
    "intro": "Welcome to Blackwood Manor, where ancient secrets await...",
    "outro": "Congratulations! You've solved all the mysteries of Blackwood Manor.",
    "chapters": [
      {
        "id": "chapter1",
        "title": "The Locked Study",
        "description": "Find the key to unlock the mysterious study",
        "storyText": "The study door is locked tight. You notice strange symbols carved around the lock..."
      }
    ]
  },
  "rewards": {
    "completion": {
      "xp": 500,
      "coins": 250,
      "items": ["mystery_solved_badge"]
    },
    "milestones": [
      {
        "puzzleIndex": 5,
        "rewards": {
          "xp": 100,
          "coins": 50,
          "items": ["chapter_complete_trophy"]
        }
      }
    ]
  },
  "startsAt": "2026-01-01T00:00:00Z",
  "endsAt": "2026-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "id": "chain-uuid",
  "name": "The Mystery of Blackwood Manor",
  "description": "Solve the mysteries of the haunted Blackwood Manor",
  "status": "active",
  "story": { ... },
  "rewards": { ... },
  "completionCount": 0,
  "startsAt": "2026-01-01T00:00:00Z",
  "endsAt": "2026-12-31T23:59:59Z",
  "createdAt": "2026-02-19T12:00:00Z",
  "updatedAt": "2026-02-19T12:00:00Z"
}
```

### Get Quest Chains
```http
GET /quest-chains?status=active&limit=10&offset=0&sortBy=createdAt&sortOrder=DESC
```

**Query Parameters:**
- `status`: Filter by status (active, inactive, archived, all)
- `limit`: Number of results (default: 10)
- `offset`: Pagination offset (default: 0)
- `sortBy`: Sort field (createdAt, completionCount, name)
- `sortOrder`: Sort direction (ASC, DESC)

### Get Quest Chain by ID
```http
GET /quest-chains/{chainId}
```

### Update Quest Chain
```http
PUT /quest-chains/{chainId}
```

### Delete Quest Chain
```http
DELETE /quest-chains/{chainId}
```

## Puzzle Management in Chains

### Add Puzzle to Chain
```http
POST /quest-chains/{chainId}/puzzles
```

**Request Body:**
```json
{
  "puzzleId": "puzzle-uuid",
  "sequenceOrder": 0,
  "unlockConditions": {
    "previousPuzzles": [],
    "minimumScore": 0,
    "timeLimit": 300,
    "noHints": false
  },
  "isCheckpoint": true,
  "checkpointRewards": {
    "xp": 50,
    "coins": 25,
    "items": ["checkpoint_achieved"]
  }
}
```

### Get Chain Puzzles
```http
GET /quest-chains/{chainId}/puzzles
```

### Remove Puzzle from Chain
```http
DELETE /quest-chains/{chainId}/puzzles/{puzzleId}
```

### Validate Chain Structure
```http
GET /quest-chains/{chainId}/validate
```

## User Progress Management

### Start Quest Chain
```http
POST /quest-chains/{chainId}/start
```

**Request Body:**
```json
{
  "userId": "user-uuid"
}
```

### Get User Progress
```http
GET /quest-chains/{chainId}/progress
```

**Request Body:**
```json
{
  "userId": "user-uuid"
}
```

### Get Next Available Puzzle
```http
GET /quest-chains/{chainId}/next-puzzle
```

**Request Body:**
```json
{
  "userId": "user-uuid"
}
```

### Complete Puzzle in Chain
```http
POST /quest-chains/{chainId}/puzzles/{puzzleId}/complete
```

**Request Body:**
```json
{
  "userId": "user-uuid",
  "score": 150,
  "timeTaken": 120,
  "hintsUsed": 1,
  "completedSuccessfully": true,
  "metadata": {
    "difficulty": "medium",
    "puzzleType": "logic",
    "movesUsed": 8,
    "completionMethod": "logical_deduction"
  }
}
```

### Reset Chain Progress
```http
POST /quest-chains/{chainId}/reset
```

**Request Body:**
```json
{
  "userId": "user-uuid"
}
```

## Data Models

### QuestChain
```typescript
interface QuestChain {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'archived';
  story: QuestChainStory;
  rewards: QuestChainRewards;
  completionCount: number;
  startsAt?: Date;
  endsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### QuestChainStory
```typescript
interface QuestChainStory {
  intro: string;
  outro: string;
  chapters: Array<{
    id: string;
    title: string;
    description: string;
    storyText: string;
  }>;
}
```

### QuestChainRewards
```typescript
interface QuestChainRewards {
  completion: {
    xp: number;
    coins: number;
    items: string[];
  };
  milestones: Array<{
    puzzleIndex: number;
    rewards: {
      xp: number;
      coins: number;
      items: string[];
    };
  }>;
}
```

### UnlockConditions
```typescript
interface UnlockConditions {
  previousPuzzles: string[]; // IDs of puzzles that must be completed
  minimumScore?: number;
  timeLimit?: number; // seconds
  noHints?: boolean;
}
```

### BranchCondition
```typescript
interface BranchCondition {
  conditionType: 'score' | 'time' | 'accuracy' | 'custom';
  operator: 'gte' | 'lte' | 'equals' | 'between';
  value: number | [number, number];
  nextPuzzleId: string; // ID of next puzzle in branch path
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `204`: No Content (successful deletion)
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

Error response format:
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

## Validation Rules

### Quest Chain Validation
- Chain name must be 1-200 characters
- Story must include intro and outro
- Chapters must have valid IDs and titles
- Rewards must have non-negative values
- Sequential order should be continuous (0,1,2... or 1,2,3...)

### Unlock Conditions Validation
- Previous puzzle IDs must exist in the chain
- Minimum score must be non-negative
- Time limit must be positive
- First puzzle should not have previous puzzle requirements

### Branch Conditions Validation
- Condition types must be valid
- Operators must be valid
- Next puzzle IDs must exist
- Value formats must match operators

## Examples

### Creating a Simple Linear Chain
```json
{
  "name": "Beginner's Logic Journey",
  "description": "Learn logic puzzles step by step",
  "story": {
    "intro": "Welcome to your logic puzzle journey!",
    "outro": "Congratulations on completing your first logic journey!",
    "chapters": [
      {
        "id": "basics",
        "title": "Logic Basics",
        "description": "Start with fundamental logic concepts",
        "storyText": "Let's begin with the basics of logical reasoning..."
      }
    ]
  },
  "rewards": {
    "completion": {
      "xp": 300,
      "coins": 150,
      "items": ["logic_novice_badge"]
    }
  }
}
```

### Adding a Puzzle with Unlock Conditions
```json
{
  "puzzleId": "puzzle-123",
  "sequenceOrder": 1,
  "unlockConditions": {
    "previousPuzzles": ["puzzle-122"],
    "minimumScore": 80,
    "timeLimit": 180
  },
  "isCheckpoint": true,
  "checkpointRewards": {
    "xp": 30,
    "coins": 15,
    "items": ["checkpoint_1"]
  }
}
```

### Branching Logic Example
```json
{
  "puzzleId": "puzzle-456",
  "sequenceOrder": 2,
  "branchConditions": [
    {
      "conditionType": "score",
      "operator": "gte",
      "value": 90,
      "nextPuzzleId": "advanced-puzzle-789"
    },
    {
      "conditionType": "score",
      "operator": "lt",
      "value": 90,
      "nextPuzzleId": "review-puzzle-101"
    }
  ]
}
```