FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3010

CMD [ "npm", "run", "start:prod" ]
