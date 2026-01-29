# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Prerequisites
```bash
# Required
Node.js 20.8+
PostgreSQL 14+
Docker (optional)

# Check versions
node --version
npm --version
psql --version
```

### 2. Clone & Install
```bash
git clone <your-repo>
cd quest-service
npm install
```

### 3. Database Setup
```bash
# Option A: Docker (Recommended)
docker-compose up -d postgres

# Option B: Local PostgreSQL
createdb quest_service
```

### 4. Environment Configuration
```bash
# Copy example environment file
cp .env.example .env

# Edit with your settings
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=quest_service
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
JWT_SECRET=your-super-secret-key
```

### 5. Run Migrations
```bash
npm run migration:run
```

### 6. Start Development Server
```bash
npm run start:dev
```

### 7. Verify Installation
```bash
# Check health endpoint
curl http://localhost:3000/health

# Open API documentation
open http://localhost:3000/api
```

## 🧪 Run Tests
```bash
# Quick test
npm run test:unit -- --testPathPattern=game-logic.controller.spec.ts

# All working tests
npm run test:unit
```

## 📝 Create Your First Puzzle
```bash
curl -X POST http://localhost:3000/puzzles \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "My First Puzzle",
    "description": "A simple logic puzzle to get started",
    "category": "logic",
    "difficulty": "easy",
    "content": {
      "type": "multiple-choice",
      "question": "What comes next in the sequence: 2, 4, 6, ?",
      "options": ["7", "8", "9", "10"],
      "correctAnswer": "8"
    },
    "difficultyRating": 2,
    "basePoints": 100,
    "timeLimit": 300,
    "maxHints": 2,
    "tags": ["sequence", "math"]
  }'
```

## 🎯 Next Steps
1. Explore the API at `/api`
2. Check out `SYSTEM_OVERVIEW.md` for detailed docs
3. Run more comprehensive tests
4. Set up your production environment

## 🆘 Need Help?
- **API Issues**: Check `/health` endpoint
- **Database Issues**: Verify connection string in `.env`
- **Test Issues**: Some tests need missing dependencies
- **Build Issues**: Run `npm run type-check` first

Happy coding! 🎉
