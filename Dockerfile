FROM node:22

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . /usr/src/app

VOLUME ["/data"]

ENV NODE_ENV DOCKER

CMD ["node", "app.js"]