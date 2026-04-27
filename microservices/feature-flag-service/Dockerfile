FROM node:20-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install --production
COPY . ./
RUN npm run build
EXPOSE 3010
CMD ["npm", "run", "start:prod"]
