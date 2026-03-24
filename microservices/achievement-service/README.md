# Achievement Service

Dedicated NestJS microservice for achievement definitions, player progress tracking, unlock evaluation, badge awarding, and unlock notifications.

## Features

- Achievement definition management
- Progress tracking by metric key
- Automatic unlock evaluation
- Badge awarding on unlock
- Notification dispatch on unlock
- Achievement history APIs
- Rarity tiers (`COMMON`, `RARE`, `EPIC`, `LEGENDARY`)

## Run

1. `cp .env.example .env`
2. `npm install`
3. `npm run start:dev`

## Docker

`docker-compose up --build`

## API

- `POST /achievements` create definition
- `POST /achievements/seed-defaults` seed baseline definitions
- `GET /achievements` list definitions
- `GET /achievements/:id` get definition
- `POST /achievements/progress` track player progress
- `GET /achievements/users/:userId/progress` get player progress
- `GET /achievements/users/:userId/history` get player achievement history
- `GET /achievements/users/:userId/badges` get player badges
- `GET /health` service health
