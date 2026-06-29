FROM node:18-alpine
WORKDIR /app
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm install --production
RUN npm run build || true
EXPOSE 3333
CMD ["node", "dist/main.js"]
