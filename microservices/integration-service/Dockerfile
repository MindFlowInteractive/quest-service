FROM node:20-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install --production
COPY . ./
RUN npm run build
EXPOSE 3009
CMD ["npm", "run", "start:prod"]
