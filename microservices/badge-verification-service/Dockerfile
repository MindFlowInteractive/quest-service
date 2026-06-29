FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm ci --production=false || true
RUN npm run build || true
EXPOSE 3001
CMD ["node", "dist/main.js"]
