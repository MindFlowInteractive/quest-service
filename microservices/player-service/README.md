# Player Service

Dedicated NestJS microservice for player management, authentication, profiles, and progress tracking.

## Features

- JWT-based authentication (register/login)
- Player profile management
- Progress tracking system
- Statistics and analytics
- Secure password hashing

## Run

1. `cp .env.example .env`
2. `npm install`
3. `npm run start:dev`

## Docker

`docker-compose up --build`

## API

### Authentication
- `POST /auth/register` - Register new player
- `POST /auth/login` - Login player
- `GET /auth/profile` - Get authenticated player info

### Player Management
- `GET /players/profile` - Get player profile
- `PATCH /players/profile` - Update player profile
- `POST /players/progress` - Track player progress
- `GET /players/progress` - Get progress history
- `GET /players/statistics` - Get player statistics
- `DELETE /players/deactivate` - Deactivate player account