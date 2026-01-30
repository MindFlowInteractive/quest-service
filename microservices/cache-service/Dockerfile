FROM node:20-alpine
WORKDIR /usr/src/app

# Install deps
COPY package.json package.json
RUN npm install --production=false

# Build
COPY . .
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/main.js"]
