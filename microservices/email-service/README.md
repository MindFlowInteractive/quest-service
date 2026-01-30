# Email and Communication Service

A robust NestJS microservice for sending transactional emails, newsletters, and player communications with support for multiple email providers, template management, queue processing, and delivery tracking.

## Features

- **Multi-Provider Support**: SendGrid and AWS SES with automatic fallback
- **Template Engine**: Handlebars-based templating with custom helpers
- **Queue Processing**: BullMQ-powered queue with exponential backoff retry logic
- **Unsubscribe Management**: Comprehensive email preference management
- **Delivery Tracking**: Open, click, bounce, and complaint tracking
- **Webhook Handlers**: SendGrid and AWS SES webhook integration
- **RESTful API**: Full-featured API for all email operations

## Architecture

```
email-service/
├── src/
│   ├── config/           # Configuration files
│   ├── emails/           # Email sending module
│   ├── providers/        # Email provider implementations
│   ├── queue/            # Queue processing module
│   ├── templates/        # Template management module
│   ├── tracking/         # Delivery tracking module
│   ├── unsubscribe/      # Unsubscribe management module
│   ├── webhooks/         # Webhook handlers
│   ├── app.module.ts     # Main application module
│   └── main.ts           # Application entry point
├── docker/               # Docker configuration
└── test/                 # Test files
```

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- SendGrid API Key or AWS SES credentials

## Quick Start

### 1. Clone and Navigate
```bash
cd microservices/email-service
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start with Docker
```bash
cd docker
docker-compose up -d
```

### 5. Or Run Locally
```bash
# Start PostgreSQL and Redis
npm run start:dev
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| SERVICE_PORT | Service port | 3006 |
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_NAME | Database name | email_service |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| EMAIL_PROVIDER | Primary provider (sendgrid/ses) | sendgrid |
| SENDGRID_API_KEY | SendGrid API key | - |
| AWS_REGION | AWS region for SES | us-east-1 |
| AWS_ACCESS_KEY_ID | AWS access key | - |
| AWS_SECRET_ACCESS_KEY | AWS secret key | - |

## API Endpoints

### Emails

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /emails/send | Send a single email |
| POST | /emails/send-templated | Send email using template |
| POST | /emails/send-batch | Send multiple emails |
| GET | /emails/stats | Get email statistics |
| GET | /emails/:id | Get email by ID |
| GET | /emails/user/:userId | Get user's emails |
| POST | /emails/:id/cancel | Cancel pending email |
| POST | /emails/:id/retry | Retry failed email |

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /templates | Create template |
| GET | /templates | List all templates |
| GET | /templates/:id | Get template by ID |
| GET | /templates/name/:name | Get template by name |
| PUT | /templates/:id | Update template |
| DELETE | /templates/:id | Delete template |
| POST | /templates/render | Render template |
| POST | /templates/:id/preview | Preview template |
| POST | /templates/:id/duplicate | Duplicate template |

### Unsubscribe

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /unsubscribe | Unsubscribe email |
| POST | /unsubscribe/token | Unsubscribe by token |
| GET | /unsubscribe/verify | Verify unsubscribe link |
| POST | /unsubscribe/resubscribe | Resubscribe email |
| GET | /unsubscribe/status/:email | Get unsubscribe status |
| GET | /unsubscribe/check | Check if unsubscribed |
| GET | /unsubscribe/bounces | List bounces |
| GET | /unsubscribe/complaints | List complaints |

### Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tracking/pixel/:emailId | Tracking pixel |
| GET | /tracking/click/:emailId | Track click redirect |
| GET | /tracking/events/:emailId | Get events by email |
| GET | /tracking/stats | Get tracking stats |
| GET | /tracking/bounces/stats | Get bounce stats |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /webhooks/sendgrid | SendGrid webhook |
| POST | /webhooks/ses | AWS SES webhook |

## Usage Examples

### Send a Simple Email
```bash
curl -X POST http://localhost:3006/emails/send \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "user@example.com",
    "toName": "John Doe",
    "subject": "Welcome!",
    "htmlContent": "<h1>Hello!</h1><p>Welcome to Quest Service.</p>",
    "textContent": "Hello! Welcome to Quest Service."
  }'
```

### Send a Templated Email
```bash
curl -X POST http://localhost:3006/emails/send-templated \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "user@example.com",
    "templateName": "welcome",
    "variables": {
      "name": "John Doe",
      "activationLink": "https://example.com/activate?token=abc123"
    }
  }'
```

### Create a Template
```bash
curl -X POST http://localhost:3006/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "welcome",
    "subject": "Welcome to Quest Service, {{name}}!",
    "htmlBody": "<h1>Hello {{name}}!</h1><p>Click <a href=\"{{activationLink}}\">here</a> to activate.</p>",
    "textBody": "Hello {{name}}! Visit {{activationLink}} to activate.",
    "category": "welcome"
  }'
```

### Check Unsubscribe Status
```bash
curl http://localhost:3006/unsubscribe/status/user@example.com
```

## Template Helpers

The template engine includes several built-in helpers:

| Helper | Usage | Example |
|--------|-------|---------|
| formatDate | `{{formatDate date "short"}}` | 1/30/2025 |
| formatCurrency | `{{formatCurrency amount "USD"}}` | $99.99 |
| uppercase | `{{uppercase name}}` | JOHN |
| lowercase | `{{lowercase name}}` | john |
| capitalize | `{{capitalize name}}` | John |
| truncate | `{{truncate text 10}}` | This is a... |
| pluralize | `{{pluralize count "item"}}` | items |
| currentYear | `{{currentYear}}` | 2025 |
| eq/ne/gt/lt | `{{#if (eq status "active")}}` | Conditionals |

## Testing

### Run Unit Tests
```bash
npm test
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Run with Coverage
```bash
npm run test:cov
```

## Docker

### Build Image
```bash
docker build -f docker/Dockerfile -t email-service .
```

### Run with Docker Compose
```bash
cd docker
docker-compose up -d
```

### View Logs
```bash
docker logs -f email-service
```

## Health Check

```bash
curl http://localhost:3006/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-30T12:00:00.000Z",
  "uptime": 3600
}
```

## License

MIT
