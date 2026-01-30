# Email Service Testing Guide

This guide provides comprehensive instructions for testing the Email and Communication Service.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [Unit Tests](#unit-tests)
4. [Integration Tests](#integration-tests)
5. [E2E Tests](#e2e-tests)
6. [Manual Testing](#manual-testing)
7. [Testing Webhooks](#testing-webhooks)
8. [Load Testing](#load-testing)

## Prerequisites

Before running tests, ensure you have:

- Node.js 18+
- Docker and Docker Compose (for integration/E2E tests)
- SendGrid API key (for live email tests)
- AWS credentials (optional, for SES tests)

## Setup

### 1. Install Dependencies
```bash
cd microservices/email-service
npm install
```

### 2. Set Up Test Environment
```bash
cp .env.example .env.test
```

Edit `.env.test` with test configuration:
```env
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5436
DB_NAME=email_service_test
REDIS_HOST=localhost
REDIS_PORT=6382
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_test_api_key
```

### 3. Start Test Infrastructure
```bash
cd docker
docker-compose up -d postgres redis
```

## Unit Tests

Unit tests focus on individual components in isolation.

### Run All Unit Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test -- template-engine.spec.ts
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run with Coverage
```bash
npm run test:cov
```

### Key Unit Test Files

| File | Description |
|------|-------------|
| template-engine.spec.ts | Tests for Handlebars template rendering |
| emails.service.spec.ts | Tests for email service logic |
| unsubscribe.service.spec.ts | Tests for unsubscribe management |
| tracking.service.spec.ts | Tests for delivery tracking |

## Integration Tests

Integration tests verify component interactions.

### Run Integration Tests
```bash
npm run test:integration
```

### Test Database Setup
The integration tests use a separate test database:
```bash
# Create test database
docker exec -it postgres-email psql -U postgres -c "CREATE DATABASE email_service_test;"
docker exec -it postgres-email psql -U postgres -d email_service_test -c "CREATE SCHEMA IF NOT EXISTS emails;"
```

## E2E Tests

End-to-end tests verify the complete API flow.

### Run E2E Tests
```bash
npm run test:e2e
```

### E2E Test Structure

The E2E tests cover:

1. **Health Check**
   - Service health endpoint
   - Service info endpoint

2. **Templates API**
   - Create template
   - List templates
   - Get template by ID
   - Render template
   - Preview template
   - Update template
   - Delete template

3. **Emails API**
   - Send simple email
   - Send templated email
   - Get email statistics
   - Cancel pending email
   - Retry failed email

4. **Unsubscribe API**
   - Unsubscribe email
   - Check unsubscribe status
   - Resubscribe email
   - Generate unsubscribe link

5. **Tracking API**
   - Get tracking statistics
   - Get bounce statistics

6. **Webhooks API**
   - SendGrid webhook handling
   - AWS SES webhook handling

## Manual Testing

### Using cURL

#### 1. Health Check
```bash
curl http://localhost:3006/health
```

#### 2. Create a Template
```bash
curl -X POST http://localhost:3006/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-template",
    "subject": "Test Subject - {{name}}",
    "htmlBody": "<h1>Hello {{name}}</h1><p>This is a test.</p>",
    "category": "custom"
  }'
```

#### 3. Render a Template
```bash
curl -X POST http://localhost:3006/templates/render \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "test-template",
    "variables": {"name": "John"}
  }'
```

#### 4. Send an Email
```bash
curl -X POST http://localhost:3006/emails/send \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "test@example.com",
    "subject": "Test Email",
    "htmlContent": "<h1>Test</h1>",
    "priority": "high"
  }'
```

#### 5. Send Templated Email
```bash
curl -X POST http://localhost:3006/emails/send-templated \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "test@example.com",
    "templateName": "test-template",
    "variables": {"name": "Jane"}
  }'
```

#### 6. Check Email Statistics
```bash
curl http://localhost:3006/emails/stats
```

#### 7. Unsubscribe an Email
```bash
curl -X POST http://localhost:3006/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "category": "marketing"
  }'
```

#### 8. Check Unsubscribe Status
```bash
curl http://localhost:3006/unsubscribe/status/test@example.com
```

### Using Postman

Import the following collection for Postman testing:

```json
{
  "info": {
    "name": "Email Service API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health",
      "item": [
        {
          "name": "Health Check",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/health"
          }
        }
      ]
    },
    {
      "name": "Templates",
      "item": [
        {
          "name": "Create Template",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/templates",
            "body": {
              "mode": "raw",
              "raw": "{\"name\": \"welcome\", \"subject\": \"Welcome {{name}}\", \"htmlBody\": \"<h1>Hello</h1>\"}"
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {"key": "baseUrl", "value": "http://localhost:3006"}
  ]
}
```

## Testing Webhooks

### SendGrid Webhook Testing

1. **Local Testing with ngrok**
```bash
ngrok http 3006
```

2. **Configure SendGrid Webhook**
   - Go to SendGrid Settings > Mail Settings > Event Webhook
   - Set URL to: `https://your-ngrok-url/webhooks/sendgrid`
   - Enable events: delivered, opened, clicked, bounced, spamreport

3. **Test Webhook Manually**
```bash
curl -X POST http://localhost:3006/webhooks/sendgrid \
  -H "Content-Type: application/json" \
  -d '[{
    "email": "test@example.com",
    "timestamp": 1706616000,
    "event": "delivered",
    "sg_message_id": "test-message-id"
  }]'
```

### AWS SES Webhook Testing

1. **Test SNS Notification**
```bash
curl -X POST http://localhost:3006/webhooks/ses \
  -H "Content-Type: application/json" \
  -d '{
    "Type": "Notification",
    "Message": "{\"notificationType\": \"Delivery\", \"mail\": {\"messageId\": \"test-ses-id\"}}",
    "MessageId": "test-notification",
    "Timestamp": "2025-01-30T12:00:00Z"
  }'
```

## Load Testing

### Using Artillery

1. **Install Artillery**
```bash
npm install -g artillery
```

2. **Create Test Script** (`load-test.yml`)
```yaml
config:
  target: "http://localhost:3006"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"

scenarios:
  - name: "Send Email"
    flow:
      - post:
          url: "/emails/send"
          json:
            toEmail: "test@example.com"
            subject: "Load Test"
            htmlContent: "<p>Test</p>"

  - name: "Health Check"
    flow:
      - get:
          url: "/health"
```

3. **Run Load Test**
```bash
artillery run load-test.yml
```

### Using k6

1. **Install k6**
```bash
brew install k6  # macOS
```

2. **Create Test Script** (`load-test.js`)
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '2m',
};

export default function () {
  const res = http.post(
    'http://localhost:3006/emails/send',
    JSON.stringify({
      toEmail: 'test@example.com',
      subject: 'K6 Test',
      htmlContent: '<p>Test</p>',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, {
    'status is 201': (r) => r.status === 201,
  });

  sleep(1);
}
```

3. **Run Load Test**
```bash
k6 run load-test.js
```

## Test Checklist

Use this checklist to verify all functionality:

### Core Features
- [ ] Service starts successfully
- [ ] Health endpoint returns 200
- [ ] Database connection works
- [ ] Redis connection works

### Templates
- [ ] Create template
- [ ] List templates
- [ ] Get template by ID
- [ ] Get template by name
- [ ] Update template
- [ ] Delete template
- [ ] Render template with variables
- [ ] Preview template
- [ ] Duplicate template
- [ ] Template validation works

### Emails
- [ ] Send simple email
- [ ] Send templated email
- [ ] Send batch emails
- [ ] Get email by ID
- [ ] Get emails by user ID
- [ ] Get email statistics
- [ ] Cancel pending email
- [ ] Retry failed email
- [ ] Scheduled emails work

### Queue
- [ ] Emails are queued correctly
- [ ] Retry logic works
- [ ] Dead letter queue works
- [ ] Priority processing works

### Unsubscribe
- [ ] Unsubscribe email
- [ ] Unsubscribe by token
- [ ] Resubscribe email
- [ ] Check unsubscribe status
- [ ] Generate unsubscribe link
- [ ] Bounces are tracked
- [ ] Complaints are tracked

### Tracking
- [ ] Open tracking pixel works
- [ ] Click tracking works
- [ ] Delivery events tracked
- [ ] Bounce events tracked
- [ ] Complaint events tracked

### Webhooks
- [ ] SendGrid webhook works
- [ ] SES webhook works
- [ ] Events update email status

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:5432
   ```
   Solution: Ensure PostgreSQL is running
   ```bash
   docker-compose up -d postgres
   ```

2. **Redis Connection Error**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:6379
   ```
   Solution: Ensure Redis is running
   ```bash
   docker-compose up -d redis
   ```

3. **SendGrid API Error**
   ```
   Error: Unauthorized
   ```
   Solution: Check your SENDGRID_API_KEY in .env

4. **Template Not Found**
   ```
   Error: Template with name 'xyz' not found
   ```
   Solution: Create the template first or check the name spelling

### Debug Mode

Run service in debug mode:
```bash
npm run start:debug
```

Check logs:
```bash
docker logs -f email-service
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Email Service Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: email_service_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: microservices/email-service
        run: npm ci

      - name: Run unit tests
        working-directory: microservices/email-service
        run: npm test

      - name: Run E2E tests
        working-directory: microservices/email-service
        env:
          DB_HOST: localhost
          REDIS_HOST: localhost
        run: npm run test:e2e
```
