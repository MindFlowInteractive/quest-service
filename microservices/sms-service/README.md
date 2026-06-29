# SMS Service

A NestJS microservice for sending SMS verification codes, alerts, reminders, and other time-sensitive notifications.

## Features

- Twilio, AWS SNS, and built-in mock provider support
- Secure OTP generation and verification
- Message templates with Handlebars rendering
- Scheduled delivery with automatic retry backoff
- Delivery receipts and webhook/manual confirmation endpoints
- Phone number normalization and validation
- Message history and analytics
- Rate limiting per phone number and stricter OTP throttling

## Quick Start

```bash
cd microservices/sms-service
npm install
cp .env.example .env
npm run start:dev
```

The default configuration uses the `mock` provider, so the service can run locally without Twilio or AWS credentials.

## Key Environment Variables

| Variable | Description | Default |
|---|---|---|
| `SERVICE_PORT` | HTTP port | `3007` |
| `DB_TYPE` | `postgres` or `sqljs` | `postgres` |
| `SMS_PROVIDER` | `mock`, `twilio`, or `sns` | `mock` |
| `SMS_DEFAULT_COUNTRY` | Phone parsing fallback region | `US` |
| `SMS_DISPATCH_INTERVAL_MS` | Poll interval for scheduled/retry messages | `5000` |
| `SMS_RATE_LIMIT_MAX_PER_WINDOW` | Max SMS per phone per window | `20` |
| `SMS_OTP_RATE_LIMIT_MAX_PER_WINDOW` | Max OTP sends per phone per window | `3` |
| `SMS_OTP_EXPIRY_MINUTES` | OTP expiration | `10` |
| `SMS_DEBUG_EXPOSE_CODES` | Include OTP codes in responses for local testing | `false` |

## Main Endpoints

### Service

- `GET /` - service info
- `GET /health` - health check

### SMS

- `POST /sms/send` - send plain SMS
- `POST /sms/send-templated` - send SMS from template
- `GET /sms/history` - list message history
- `GET /sms/stats` - aggregated delivery analytics
- `POST /sms/:id/cancel` - cancel pending/scheduled SMS
- `POST /sms/:id/retry` - retry failed SMS

### Templates

- `POST /templates` - create template
- `GET /templates` - list templates
- `GET /templates/:id` - fetch template
- `GET /templates/name/:name` - fetch template by name
- `PUT /templates/:id` - update template
- `DELETE /templates/:id` - delete template
- `POST /templates/render` - render a template payload

### OTP

- `POST /otp/send` - generate and send verification code
- `POST /otp/verify` - verify a code

### Receipts

- `POST /receipts/confirm` - manually confirm/update delivery status
- `POST /receipts/webhook` - provider webhook target
- `GET /receipts/message/:messageId` - list receipt events for a message

## Example Requests

### Send an Alert

```bash
curl -X POST http://localhost:3007/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+15555550123",
    "body": "Your Quest account password was changed.",
    "type": "alert",
    "priority": "high"
  }'
```

### Create a Template

```bash
curl -X POST http://localhost:3007/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "otp-verification",
    "body": "Your {{purpose}} code is {{code}}. It expires in {{expiryMinutes}} minutes.",
    "category": "otp"
  }'
```

### Send OTP

```bash
curl -X POST http://localhost:3007/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+15555550123",
    "purpose": "login"
  }'
```

## Testing

```bash
npm run build
npm run test:e2e
```

The e2e test suite runs against `sqljs` and the mock provider, so it does not require PostgreSQL or a real SMS account.
