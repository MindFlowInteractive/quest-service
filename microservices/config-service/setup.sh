#!/bin/bash

# Config Service Quick Start Script

echo "🚀 Config Service - Quick Start"
echo "================================"
echo ""

# Check if directory exists
if [ ! -d "microservices/config-service" ]; then
    echo "❌ Config Service not found at microservices/config-service"
    exit 1
fi

cd microservices/config-service

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Update .env with your configuration!"
    echo ""
    echo "Important settings to update:"
    echo "  - ENCRYPTION_KEY (must be 32+ characters)"
    echo "  - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD"
    echo "  - SERVICE_PORT (default: 3020)"
fi

echo ""
echo "📚 Available commands:"
echo "  npm run start:dev    - Start in development mode"
echo "  npm run build        - Build the project"
echo "  npm test            - Run unit tests"
echo "  npm run lint        - Check and fix code style"
echo ""
echo "🐳 Docker option:"
echo "  docker-compose up -d - Start with Docker (PostgreSQL included)"
echo ""
echo "✅ Setup complete! Follow the README for next steps."
echo "   📖 See microservices/config-service/README.md"
