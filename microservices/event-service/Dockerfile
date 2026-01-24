# Dockerfile for Event Service
FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["npm", "run", "start:prod"]
