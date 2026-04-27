# Reports Module

A comprehensive reporting system for the quest service that allows players to report inappropriate content, offensive usernames, and abusive chat messages.

## Features

- **Content Reporting**: Players can report puzzles, players, and chat messages
- **Priority Scoring**: Reports automatically get priority based on volume
- **Duplicate Prevention**: Same user cannot report same target multiple times
- **Auto-Escalation**: 5+ reports on same target within 24h triggers critical priority
- **Moderator Queue**: Paginated queue sorted by priority for efficient review
- **Reporter Notifications**: Automatic notifications when reports are resolved
- **Admin Statistics**: Comprehensive dashboard with reporting analytics

## API Endpoints

### POST /reports
Submit a new report (requires authentication)

**Request Body:**
```json
{
  "targetType": "puzzle|player|chat_message",
  "targetId": "string",
  "reason": "string"
}
```

**Response:**
```json
{
  "message": "Report submitted successfully",
  "report": {
    "id": "uuid",
    "reporterId": "uuid",
    "targetType": "puzzle",
    "targetId": "uuid",
    "reason": "string",
    "priority": "low|medium|high|critical",
    "status": "open|reviewing|resolved",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### GET /reports
Get paginated moderator queue (requires moderator/admin role)

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "reports": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### PATCH /reports/:id
Update report status and resolution (requires moderator/admin role)

**Request Body:**
```json
{
  "status": "open|reviewing|resolved",
  "resolution": "string (optional)"
}
```

### GET /reports/stats
Get admin dashboard statistics (requires admin role)

**Response:**
```json
{
  "openCount": 5,
  "averageResolutionTime": 3600,
  "reportsByType": {
    "puzzle": 3,
    "player": 2
  },
  "totalReports": 10,
  "resolvedToday": 2,
  "escalatedReports": 1
}
```

## Priority Logic

- **Low**: First report on a target
- **Medium**: 2-3 reports on same target
- **High**: 4+ reports on same target
- **Critical**: 5+ reports within 24 hours (auto-escalation)

## Auto-Escalation

When 5+ reports are received on the same target within 24 hours:
- All existing reports for that target are escalated to CRITICAL priority
- An escalation event is emitted for moderator notification
- Reports appear at the top of the moderator queue

## Events

The system emits the following events:

- `report.created`: When a new report is submitted
- `report.resolved`: When a report is marked as resolved
- `report.escalated`: When auto-escalation is triggered

## Database Schema

```sql
CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id),
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('puzzle', 'player', 'chat_message')),
  target_id VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  priority VARCHAR(10) NOT NULL DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved')),
  resolution TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id)
);

CREATE INDEX idx_reports_target ON content_reports(target_type, target_id);
CREATE INDEX idx_reports_status ON content_reports(status);
CREATE INDEX idx_reports_priority ON content_reports(priority);
CREATE INDEX idx_reports_created_at ON content_reports(created_at);
```

## Testing

The module includes comprehensive tests:

- Unit tests for service logic
- Controller tests for API endpoints
- E2E tests for complete workflows
- Tests for auto-escalation and priority logic

Run tests with:
```bash
npm test -- reports
```

## Security

- JWT authentication required for all endpoints
- Role-based access control (users, moderators, admins)
- Input validation and sanitization
- Rate limiting (inherited from app configuration)

## Dependencies

- TypeORM for database operations
- EventEmitter2 for event handling
- NestJS JWT for authentication
- Class-validator for input validation
- Swagger for API documentation
