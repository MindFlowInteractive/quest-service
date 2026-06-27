FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=builder /usr/src/app/dist ./dist
EXPOSE 3030
CMD ["node", "dist/main"]
