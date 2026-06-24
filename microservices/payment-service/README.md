# Payment Service

NestJS microservice for fiat payment processing, subscription billing, invoice generation, and refund handling.

## Features

- **Payment Processing** — Process one-time payments via Stripe (with mock fallback for development)
- **Subscription Billing** — Create, cancel, and bill recurring subscriptions
- **Invoice Generation** — Generate and manage invoices with line items
- **Payment Methods** — Store and manage user payment methods
- **Refund Processing** — Process full or partial refunds
- **Webhook Handling** — Handle Stripe payment status webhooks securely

## Quick Start

```bash
cp .env.example .env
npm install
npm run start:dev
```

The service runs on port **3019** by default.

## Docker

```bash
docker-compose up --build
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/payments/providers` | List payment providers |
| POST | `/payments/:provider/process` | Process a payment |
| POST | `/payments/:provider/refund` | Refund a payment |
| POST | `/invoices` | Create an invoice |
| POST | `/subscriptions` | Create a subscription |
| POST | `/payment-methods` | Add a payment method |
| POST | `/webhooks/stripe` | Stripe webhook handler |

## Testing

```bash
npm test
npm run test:e2e
```

## Environment Variables

See `.env.example` for required configuration including Stripe keys and database settings.
