FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
COPY . .
EXPOSE 3000
CMD [ "npm", "run", "start:dev" ]
