FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install --omit=dev

COPY . .
RUN npm run build

EXPOSE 3007
CMD ["node", "dist/main"]
