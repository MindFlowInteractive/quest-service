#!/bin/bash

echo "🎯 NESTJS PROJECT ANALYSIS"
echo "=========================="

echo -e "\n📊 FILE STATISTICS:"
echo "  TypeScript files: $(find . -name "*.ts" -not -path "./node_modules/*" 2>/dev/null | wc -l)"
echo "  JavaScript files: $(find . -name "*.js" -not -path "./node_modules/*" 2>/dev/null | wc -l)"
echo "  Test files: $(find . -name "*.spec.ts" -o -name "*.test.ts" 2>/dev/null | wc -l)"
echo "  Entity files: $(find . -name "*.entity.ts" 2>/dev/null | wc -l)"
echo "  DTO files: $(find . -name "*.dto.ts" 2>/dev/null | wc -l)"

echo -e "\n🏗️  ARCHITECTURE OVERVIEW:"
echo "  Main Application: $(grep -l "main.ts" src/ 2>/dev/null || echo "Not found")"
echo "  App Module: $(find src -name "app.module.ts" 2>/dev/null | head -1)"

echo -e "\n📁 MODULE BREAKDOWN:"
echo "  Total Modules: $(find src -name "*.module.ts" 2>/dev/null | wc -l)"
echo "  Microservices: $(find microservices -name "*.module.ts" 2>/dev/null | wc -l)"

echo -e "\n🔧 SERVICE TYPES:"
echo "  Core Services: $(find src -name "*.service.ts" -not -path "*/test/*" 2>/dev/null | wc -l)"
echo "  Microservices: $(find microservices -name "*.service.ts" 2>/dev/null | wc -l)"

echo -e "\n🎮 CONTROLLER COUNT:"
echo "  Main Controllers: $(find src -name "*.controller.ts" -not -path "*/test/*" 2>/dev/null | wc -l)"
echo "  Microservice Controllers: $(find microservices -name "*.controller.ts" 2>/dev/null | wc -l)"

echo -e "\n🗄️  DATABASE ENTITIES:"
find src -name "*.entity.ts" 2>/dev/null | sed 's|src/||' | sort | head -10
if [ $(find src -name "*.entity.ts" 2>/dev/null | wc -l) -gt 10 ]; then
    echo "  ... and $(($(find src -name "*.entity.ts" 2>/dev/null | wc -l) - 10)) more"
fi

echo -e "\n🧩 KEY MODULES (by size):"
for module in puzzle puzzles game-engine multiplayer tournaments; do
    count=$(find src -path "*$module*" -name "*.ts" 2>/dev/null | wc -l)
    if [ $count -gt 0 ]; then
        echo "  $module: $count files"
    fi
done

echo -e "\n🐳 DOCKER SETUP:"
if [ -f "docker-compose.yml" ]; then
    echo "  Services in docker-compose:"
    grep -E '^  [a-zA-Z]+:' docker-compose.yml | sed 's/://g;s/^/    /'
fi

echo -e "\n📦 BUILD CONFIG:"
if [ -f "nest-cli.json" ]; then
    echo "  Source root: $(jq -r '.sourceRoot // "src"' nest-cli.json 2>/dev/null || echo 'src')"
fi

echo -e "\n✅ VERIFICATION:"
echo "  Main entry: $(ls -la index.ts 2>/dev/null || echo 'Not found')"
echo "  Package manager: $(grep -q "pnpm-lock" package-lock.json && echo 'npm' || echo 'unknown')"