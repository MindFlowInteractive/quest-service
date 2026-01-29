# Puzzle Editor and Creation Tools - Comprehensive Documentation

## Overview

The Puzzle Editor is a comprehensive system that empowers content creators and community members to design, test, publish, and collaborate on engaging puzzles for the game. It provides intuitive tools, validation frameworks, community features, and full version control.

## Table of Contents

1. [Architecture](#architecture)
2. [Core Components](#core-components)
3. [Key Features](#key-features)
4. [API Reference](#api-reference)
5. [Workflows](#workflows)
6. [Best Practices](#best-practices)
7. [Configuration](#configuration)

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Puzzle Editor Frontend                     │
│  (Drag-Drop, Component Palette, Real-time Collaboration)     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Puzzle Editor API Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Editor       │  │ Preview      │  │ Collaboration│       │
│  │ Controller   │  │ Controller   │  │ Controller   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Core Services Layer                              │
│ ┌──────────────────┐  ┌──────────────────┐                  │
│ │ Puzzle Editor    │  │ Validation       │                  │
│ │ Service          │  │ Service          │                  │
│ └──────────────────┘  └──────────────────┘                  │
│ ┌──────────────────┐  ┌──────────────────┐                  │
│ │ Preview Service  │  │ Template Service │                  │
│ └──────────────────┘  └──────────────────┘                  │
│ ┌──────────────────┐  ┌──────────────────┐                  │
│ │ Community Subs   │  │ Batch Operations │                  │
│ └──────────────────┘  └──────────────────┘                  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Data Persistence Layer                           │
│ ┌──────────────────┐  ┌──────────────────┐                  │
│ │ Puzzle Editor    │  │ Version Control  │                  │
│ │ Entities         │  │ Entities         │                  │
│ └──────────────────┘  └──────────────────┘                  │
│ ┌──────────────────┐  ┌──────────────────┐                  │
│ │ Templates        │  │ Community Subs   │                  │
│ └──────────────────┘  └──────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. PuzzleEditor Entity

**Purpose**: Represents the main editor instance for puzzle creation

**Key Fields**:
- `id`: Unique identifier
- `title`: Puzzle name
- `status`: DRAFT, IN_PROGRESS, TESTING, READY_FOR_PUBLICATION, PUBLISHED
- `components`: Visual puzzle components
- `connections`: Component relationships
- `createdBy`: Owner user ID
- `collaborators`: List of collaborating users
- `metadata`: Puzzle type, difficulty, tags

### 2. PuzzleEditorVersion

**Purpose**: Tracks version history and enables rollback

**Key Fields**:
- `versionNumber`: Sequential version number
- `state`: Full editor state snapshot
- `description`: Change description
- `isPublished`: Whether this version was published
- `metadata`: Test results, approvals, tags

### 3. PuzzleTemplate

**Purpose**: Pre-built puzzle patterns for quick creation

**Key Fields**:
- `baseState`: Initial editor state
- `requiredComponents`: Must-have component types
- `suggestedComponents`: Recommended components
- `constraints`: Template-specific rules
- `usageCount`: Track popularity
- `rating`: Community rating

### 4. CommunitySubmission

**Purpose**: Manages community puzzle submissions

**Key Fields**:
- `status`: DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, FEATURED
- `reviews`: Moderation feedback
- `upvotes/downvotes`: Community voting
- `metadata`: Playtest data, difficulty estimation

### 5. CommunityReview

**Purpose**: Detailed reviews and feedback on submissions

**Key Fields**:
- `role`: COMMUNITY_MEMBER, MODERATOR, ADMIN, GAME_DESIGNER
- `status`: PENDING, REVIEWING, APPROVED, REQUESTED_CHANGES, REJECTED
- `rating`: 1-5 star rating
- `checklist`: Quality assurance items

---

## Key Features

### 1. Visual Puzzle Editor

#### Component System
- **Component Types**:
  - Grid Components: GRID_CELL, GRID_ROW, GRID_COLUMN
  - Logic Components: CONSTRAINT, RULE, CONDITION
  - Sequence Components: SEQUENCE_ELEMENT, PATTERN_ELEMENT
  - Spatial Components: SPATIAL_OBJECT, OBSTACLE, TARGET
  - Interactive Components: BUTTON, TEXT_INPUT, DROPDOWN, RADIO_GROUP
  - Display Components: TEXT, IMAGE, HINT_BOX, TIMER

#### Drag-and-Drop Functionality
```typescript
// Components can be dragged from palette and dropped on canvas
// Real-time validation ensures valid placements
// Snap-to-grid alignment available
// Undo/redo support for all operations
```

#### Component Properties
- Position (x, y coordinates)
- Size (width, height)
- Z-index (layering)
- Custom properties based on type
- Metadata and descriptions
- Constraints and validation rules

### 2. Validation Framework

#### Comprehensive Validation
- **Component Validation**: Type-specific rules and required properties
- **Connection Validation**: Valid references between components
- **Constraint Validation**: Custom puzzle-specific rules
- **Graph Analysis**: Detects isolated components and circular dependencies
- **Auto-Fix**: Automatic correction of common issues

#### Validation Results
```json
{
  "isValid": false,
  "errors": [
    {
      "id": "error_001",
      "componentId": "comp_123",
      "message": "Component must have a title",
      "severity": "error",
      "autoFixable": true
    }
  ],
  "warnings": [
    {
      "id": "warning_001",
      "message": "Component has no description"
    }
  ],
  "suggestions": [
    {
      "id": "suggestion_001",
      "message": "Add descriptions to components for clarity"
    }
  ]
}
```

### 3. Preview and Testing

#### Live Preview
```typescript
// Start a preview session
const session = await previewService.startPreviewSession(
  editorId,
  components,
  connections,
  { simulationSpeed: 1.0, autoPlay: false }
);

// Record moves and observe state changes
await previewService.recordMove(session.id, 'button_click', { 
  buttonId: 'submit_btn' 
});

// Undo/reset functionality
await previewService.undoMove(session.id);
await previewService.resetPreview(session.id);

// Replay recordings
const replay = await previewService.replaySession(session.id, 1.5);
```

#### Automated Testing
```typescript
// Test puzzle with multiple attempts
const results = await previewService.testPuzzle(
  components,
  connections,
  {
    attempts: 5,
    maxTimePerAttempt: 5000,
    recordMetrics: true
  }
);

// Results include
{
  "successRate": 85,              // % of successful attempts
  "avgCompletionTime": 120000,   // milliseconds
  "avgAttempts": 2.5,            // average attempts per success
  "commonFailures": [...],       // most common failure reasons
  "suggestedImprovements": [...] // auto-generated suggestions
}
```

### 4. Template System

#### Using Templates
```typescript
// Get popular templates
const templates = await templateService.getPopularTemplates(10);

// Get templates by type
const logicTemplates = await templateService.getTemplatesByType('LOGIC_GRID');

// Use template to create new editor
const editor = await editorService.createEditor({
  title: 'My Logic Puzzle',
  templateId: 'template_123'
}, userId);
```

#### Template Structure
Templates define:
- Base state with initial components
- Required component types
- Suggested components
- Constraints and rules
- Example puzzles
- Target audience and difficulty

### 5. Version Control

#### Creating Versions
```typescript
// Save a version snapshot
const version = await editorService.createVersion(
  editorId,
  {
    description: 'Added constraint for logic solution',
    versionTag: 'v1.2',
    metadata: { testResults: [...] }
  },
  userId
);
```

#### Version History
```typescript
// Get all versions
const versions = await editorService.getVersionHistory(editorId, userId);

// Version details
{
  "id": "version_123",
  "versionNumber": 5,
  "versionTag": "v1.2",
  "state": { /* full editor state snapshot */ },
  "description": "Added constraint for logic solution",
  "metadata": {
    "changesSummary": "...",
    "affectedComponents": ["comp_1", "comp_2"],
    "testResults": [...],
    "approvedBy": "moderator_id",
    "approvedAt": "2024-01-20T10:00:00Z"
  }
}
```

#### Rollback
```typescript
// Restore from previous version
const restored = await editorService.restoreVersion(
  editorId,
  versionId,
  userId
);
```

### 6. Collaboration

#### Adding Collaborators
```typescript
// Add team member
await editorService.addCollaborator(editorId, collaboratorId, userId);

// Remove collaborator
await editorService.removeCollaborator(editorId, collaboratorId, userId);
```

#### Real-time Collaboration
- Cursor positions visible to all collaborators
- Live change streaming
- Conflict resolution strategies
- Comment and annotation system
- Permission-based access control

### 7. Batch Operations

#### Bulk Processing
```typescript
// Start batch operation
const batch = await batchService.startBatchOperation(
  'BULK_VALIDATE',
  ['puzzle_1', 'puzzle_2', 'puzzle_3'],
  { /* config */ },
  userId
);

// Monitor progress
const status = await batchService.getBatchOperation(batchId);
// {
//   "status": "PROCESSING",
//   "progress": 66.7,
//   "estimatedCompletionTime": "2024-01-20T10:05:00Z"
// }
```

#### Supported Operations
- `BULK_UPDATE`: Update multiple puzzles
- `BULK_PUBLISH`: Publish multiple puzzles
- `BULK_DELETE`: Delete multiple puzzles
- `BULK_TAG`: Add tags to multiple puzzles
- `BULK_VALIDATE`: Validate multiple puzzles
- `BULK_TEST`: Test multiple puzzles
- `BULK_EXPORT`: Export multiple puzzles

### 8. Import/Export

#### Export Puzzle
```typescript
// Export in different formats
const exported = await importExportService.exportPuzzle(
  editorState,
  {
    format: 'JSON',
    version: '1.0',
    includeMetadata: true,
    includeVersionHistory: true,
    includeCollaborators: false
  },
  metadata
);

// Supported formats: JSON, XML, YAML, CSV, BINARY (compressed)
```

#### Import Puzzle
```typescript
// Import from external format
const imported = await importExportService.importPuzzle(
  jsonData,
  {
    format: 'JSON',
    mergeDuplicates: false,
    updateExisting: true,
    validateOnImport: true,
    autoCreateMissingDependencies: true
  }
);
```

### 9. Community and Moderation

#### Submit to Community
```typescript
// Submit puzzle for community review
const submission = await communitySubs.submitPuzzle(
  editorId,
  {
    category: 'Logic Puzzles',
    title: 'The Zebra Puzzle',
    description: 'A challenging logic grid puzzle',
    tags: ['logic', 'advanced', 'deduction'],
    recommendedAgeGroup: '14+'
  },
  userId
);
```

#### Moderation Workflow
```
SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED
                ↓
          REQUESTED_CHANGES → RESUBMIT
                ↓
              FEATURED (optional)
```

#### Review Submission
```typescript
// Submit review
const review = await communitySubs.reviewSubmission(
  submissionId,
  {
    rating: 4,
    feedback: 'Well-designed puzzle with good difficulty curve',
    suggestions: ['Consider adding more hints'],
    status: 'REQUESTED_CHANGES'
  },
  reviewerId,
  'MODERATOR'
);
```

#### Community Voting
```typescript
// Community members can upvote/downvote
await communitySubs.upvoteSubmission(submissionId, userId);
await communitySubs.downvoteSubmission(submissionId, userId);
```

---

## API Reference

### Puzzle Editor Endpoints

#### Create Editor
```
POST /puzzle-editor
Authorization: Bearer {token}

{
  "title": "My Logic Puzzle",
  "description": "A challenging logic grid",
  "templateId": "template_123",
  "tags": ["logic", "advanced"],
  "isPublic": false,
  "isCollaborative": true
}

Response: 201 Created
{
  "id": "editor_123",
  "title": "My Logic Puzzle",
  "status": "DRAFT",
  "createdBy": "user_123",
  "components": [],
  "connections": [],
  "createdAt": "2024-01-20T10:00:00Z"
}
```

#### Save Editor State
```
POST /puzzle-editor/{id}/save
Authorization: Bearer {token}

{
  "components": [...],
  "connections": [...],
  "description": "Added three new constraints",
  "versionTag": "v1.1"
}

Response: 200 OK
{ /* updated editor */ }
```

#### Validate Puzzle
```
POST /puzzle-editor/{id}/validate
Authorization: Bearer {token}

{
  "autoFix": false
}

Response: 200 OK
{
  "isValid": true,
  "errors": [],
  "warnings": [],
  "suggestions": []
}
```

#### Publish Puzzle
```
POST /puzzle-editor/{id}/publish
Authorization: Bearer {token}

{
  "title": "The Zebra Puzzle",
  "description": "A classic logic grid puzzle",
  "category": "Logic Puzzles",
  "difficulty": "HARD",
  "tags": ["logic", "advanced"],
  "scoring": { "basePoints": 250 }
}

Response: 200 OK
{ /* created puzzle entity */ }
```

### Preview Endpoints

#### Start Preview Session
```
POST /puzzle-editor/{editorId}/preview/sessions
Authorization: Bearer {token}

{
  "config": {
    "simulationSpeed": 1.0,
    "autoPlay": false,
    "recordReplay": true
  }
}

Response: 201 Created
{
  "id": "session_123",
  "puzzleEditorId": "editor_123",
  "startTime": "2024-01-20T10:00:00Z",
  "currentState": { /* puzzle state */ }
}
```

#### Test Puzzle
```
GET /puzzle-editor/{editorId}/preview/test?attempts=5&maxTime=5000
Authorization: Bearer {token}

Response: 200 OK
{
  "successRate": 85,
  "avgCompletionTime": 120000,
  "avgAttempts": 2.5,
  "commonFailures": ["Incorrect constraint interpretation"],
  "suggestedImprovements": ["Add hint system"]
}
```

### Template Endpoints

#### Get Popular Templates
```
GET /puzzle-templates/popular/list?limit=10

Response: 200 OK
[
  {
    "id": "template_123",
    "name": "Basic Logic Grid",
    "puzzleType": "LOGIC_GRID",
    "difficulty": "EASY",
    "usageCount": 450,
    "rating": 4.5
  }
]
```

#### Use Template
```
POST /puzzle-templates/{id}/use
Authorization: Bearer {token}

{
  "title": "My First Logic Puzzle",
  "description": "Using the template"
}

Response: 201 Created
{ /* new editor created from template */ }
```

### Community Submission Endpoints

#### Submit to Community
```
POST /community-submissions/{editorId}/submit
Authorization: Bearer {token}

{
  "category": "Logic Puzzles",
  "title": "The Zebra Puzzle",
  "description": "A classic logic grid",
  "tags": ["logic", "advanced"],
  "recommendedAgeGroup": "14+"
}

Response: 201 Created
{ /* submission created */ }
```

#### Get Moderation Queue
```
GET /community-submissions/moderation/queue?status=SUBMITTED&page=1
Authorization: Bearer {token}
X-User-Role: MODERATOR

Response: 200 OK
{
  "submissions": [...],
  "total": 25,
  "page": 1,
  "limit": 20
}
```

#### Review Submission
```
POST /community-submissions/{id}/review
Authorization: Bearer {token}

{
  "rating": 4,
  "feedback": "Well designed puzzle",
  "suggestions": ["Add more hints"],
  "checklist": [{...}],
  "status": "APPROVED"
}

Response: 201 Created
{ /* review created */ }
```

### Batch Operations Endpoints

#### Start Batch Operation
```
POST /batch-operations
Authorization: Bearer {token}

{
  "operationType": "BULK_VALIDATE",
  "targetPuzzles": ["puzzle_1", "puzzle_2", "puzzle_3"],
  "configuration": {}
}

Response: 202 Accepted
{
  "id": "batch_123",
  "operationType": "BULK_VALIDATE",
  "status": "PROCESSING",
  "progress": 0,
  "startTime": "2024-01-20T10:00:00Z"
}
```

#### Get Batch Status
```
GET /batch-operations/{id}
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "batch_123",
  "status": "PROCESSING",
  "progress": 66.7,
  "results": [
    {
      "puzzleId": "puzzle_1",
      "status": "success",
      "message": "Successfully validated"
    }
  ]
}
```

---

## Workflows

### Standard Puzzle Creation Workflow

1. **Initialize Editor**
   - Create new editor from scratch or template
   - Set initial metadata (type, difficulty, category)

2. **Design Puzzle**
   - Add components from palette
   - Position and configure components
   - Create connections between components
   - Define constraints and rules

3. **Validate**
   - Run validation checks
   - Auto-fix common issues
   - Review warnings and suggestions

4. **Test**
   - Start preview session
   - Manually play through puzzle
   - Run automated tests
   - Record and replay sessions
   - Review test metrics and suggestions

5. **Refine**
   - Make adjustments based on test results
   - Create version snapshots
   - Track changes with descriptions

6. **Publish**
   - Final validation pass
   - Create puzzle entity
   - Set difficulty rating and base points
   - Publish to game

7. **Share & Collaborate** (Optional)
   - Add collaborators
   - Share for feedback
   - Submit to community

### Community Submission Workflow

1. **Create Quality Puzzle**
   - Follow standard creation workflow
   - Test thoroughly
   - Document design choices

2. **Submit to Community**
   - Submit via community submission endpoint
   - Provide category, title, description
   - Add appropriate tags

3. **Undergo Review**
   - Moderators/reviewers assess puzzle
   - Community members can rate/vote
   - Reviews provide feedback

4. **Make Revisions** (if needed)
   - Address reviewer feedback
   - Update puzzle accordingly
   - Resubmit for approval

5. **Get Approved**
   - Puzzle added to community library
   - Can be featured by admins
   - Becomes available to all players

---

## Best Practices

### Puzzle Design

1. **Clear Goals**: Make puzzle objective obvious to players
2. **Consistent Logic**: Ensure rules are applied consistently
3. **Progressive Difficulty**: Gradually increase complexity
4. **Feedback**: Provide clear feedback on player actions
5. **Hints**: Include helpful hints without spoiling solution
6. **Testing**: Test extensively with different play styles

### Component Organization

1. **Meaningful IDs**: Use descriptive component IDs
2. **Grouping**: Organize related components logically
3. **Documentation**: Add descriptions to all components
4. **Consistent Naming**: Follow naming conventions
5. **Constraint Documentation**: Clearly document all constraints

### Version Management

1. **Frequent Snapshots**: Create versions for major changes
2. **Descriptive Messages**: Use clear version descriptions
3. **Testing Before Publish**: Create test version before publishing
4. **Tag Important Versions**: Mark published versions

### Collaboration

1. **Clear Roles**: Define collaborator responsibilities
2. **Communication**: Use comments and annotations
3. **Review Process**: Have peers review before publish
4. **Conflict Resolution**: Use collaborative features to resolve conflicts

### Testing

1. **Multiple Playthroughs**: Test with different approaches
2. **Edge Cases**: Test boundary conditions
3. **Difficulty Balance**: Ensure appropriate difficulty
4. **Completion Time**: Monitor and optimize completion time
5. **Common Mistakes**: Document and address common errors

---

## Configuration

### Environment Variables

```env
# Puzzle Editor Configuration
PUZZLE_EDITOR_MAX_COMPONENTS=500
PUZZLE_EDITOR_MAX_CONNECTIONS=1000
PUZZLE_EDITOR_MAX_COLLABORATORS=10
PUZZLE_EDITOR_AUTO_SAVE_INTERVAL=30000  # milliseconds
PUZZLE_EDITOR_VERSION_RETENTION=100      # number of versions to keep

# Template Configuration
PUZZLE_TEMPLATE_MAX_SIZE=10485760        # bytes
PUZZLE_TEMPLATE_FEATURED_COUNT=10

# Community Configuration
COMMUNITY_MIN_REVIEW_COUNT=3
COMMUNITY_APPROVAL_THRESHOLD=75          # percentage
COMMUNITY_FEATURED_COUNT=5
COMMUNITY_AUTO_ARCHIVE_DAYS=180

# Batch Operations
BATCH_MAX_SIZE=1000
BATCH_TIMEOUT=600000                     # milliseconds
BATCH_THREAD_POOL_SIZE=5
```

### Database Indices

```sql
-- Performance optimization indices
CREATE INDEX idx_puzzle_editor_created_by ON puzzle_editors(created_by);
CREATE INDEX idx_puzzle_editor_status ON puzzle_editors(status);
CREATE INDEX idx_editor_version_puzzle_id ON puzzle_editor_versions(puzzle_editor_id);
CREATE INDEX idx_community_sub_status ON community_submissions(status);
CREATE INDEX idx_community_review_submission ON community_reviews(submission_id);
```

---

## Future Enhancements

1. **AI-Powered Suggestions**: Generate puzzle suggestions based on patterns
2. **Multiplayer Puzzles**: Support collaborative puzzle solving
3. **Advanced Analytics**: Detailed player behavior analysis
4. **Visual Theme Editor**: Customize puzzle appearance
5. **Mobile Preview**: Test on mobile devices
6. **Undo/Redo Optimization**: Improve performance for large changes
7. **Offline Mode**: Work offline with cloud sync
8. **Plugin System**: Allow community extensions

---

## Support & Troubleshooting

### Common Issues

**Issue**: Validation errors preventing publish
**Solution**: Use auto-fix feature or manually correct identified issues

**Issue**: Import fails with format error
**Solution**: Ensure file format matches specification and data structure

**Issue**: Preview session crashes
**Solution**: Check for missing component properties or invalid connections

**Issue**: Batch operation timeout
**Solution**: Reduce batch size or increase timeout configuration

---

## Conclusion

The Puzzle Editor provides a comprehensive, user-friendly platform for creating engaging puzzles. With its powerful validation, testing, collaboration, and community features, it enables content creators of all skill levels to contribute quality content to the game.

For technical documentation on individual services, see the corresponding service files in `/src/puzzle-editor/services/`.
