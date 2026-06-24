# SMS Service

NestJS microservice for sending verification codes, alerts, and time-sensitive text messages.

## Features

- SMS, message, and delivery receipt entities backed by TypeORM/PostgreSQL
- Provider abstraction with local console sending and Twilio HTTP support
- Secure OTP generation with hashed verification codes and expiry
- Handlebars message templates
- Scheduled message dispatch through `@nestjs/schedule`
- Delivery receipt webhook endpoint
- Phone validation, per-phone rate limiting, history, and analytics
- Docker and docker-compose configuration

## Local Run

```bash
cd microservices/sms-service
npm install
npm run start:dev
```

The default `SMS_PROVIDER=console` logs outbound SMS messages and marks them sent. Set `SMS_PROVIDER=twilio` with `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` to send real SMS.

## API

- `GET /health`
- `POST /sms/send`
- `POST /sms/send-template`
- `POST /sms/otp`
- `POST /sms/otp/verify`
- `POST /sms/receipts`
- `GET /sms`
- `GET /sms/:id`
- `POST /sms/:id/cancel`
- `GET /sms-analytics`
- `GET /sms-templates`

## Docker

```bash
cd microservices/sms-service
docker compose -f docker/docker-compose.yml up --build
```
