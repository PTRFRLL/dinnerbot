FROM node:12
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
VOLUME [ "/data" ]
CMD [ "npm", "run", "docker" ]