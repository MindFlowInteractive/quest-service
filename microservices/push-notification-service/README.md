# Push Notification Service

NestJS microservice for mobile and web push notifications with Firebase Cloud Messaging, device token management, scheduled sends, segmentation, A/B tests, delivery tracking, and analytics.

## Run Locally

```bash
cp .env.example .env
npm install
npm run start:dev
```

Health check:

```bash
curl http://localhost:3020/health
```

Swagger docs are available at `http://localhost:3020/docs`.

## Docker

```bash
cp .env.example .env
docker-compose up --build
```

## Core Endpoints

- `POST /devices/register` registers or refreshes a device token.
- `POST /push-notifications/send` queues a user notification.
- `POST /push-notifications/schedule` schedules a future notification.
- `POST /push-notifications/broadcast` sends to a segment.
- `GET /push-notifications/user/:userId` returns user notification history.
- `GET /delivery/notification/:notificationId/stats` returns delivery stats.
- `POST /segments` creates a targeting segment.
- `POST /ab-tests` creates an A/B notification test.
- `POST /ab-tests/:id/launch` starts and queues an A/B test for its segment.
- `GET /ab-tests/:id/results` returns variant delivery analytics.
- `GET /analytics/overview` returns service-level delivery analytics.

## Firebase

Set `FIREBASE_SERVICE_ACCOUNT_PATH` to a Firebase service account JSON file. If it is not configured, the service still runs and records failed delivery attempts instead of sending to FCM.
