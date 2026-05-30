# Slot Machine Service

Simple NestJS-style microservice that provides provably-fair slot-machine spins.

Endpoints:
- GET /slot/seed-hash -> returns current server seed hash
- GET /slot/reveal-seed -> reveal last server seed (rotates seed)
- POST /slot/spin -> { userId, clientSeed, betAmount }
- GET /slot/history/:userId -> returns spin history

Run locally:

```bash
cd microservices/slot-machine-service
npm install
npm run dev
```

Docker:

```bash
docker build -t slot-machine-service .
docker run -p 3333:3333 slot-machine-service
```
