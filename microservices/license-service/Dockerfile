FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
