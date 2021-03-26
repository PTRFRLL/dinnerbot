FROM node:14

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --prod

COPY . /usr/src/app

VOLUME ["/config", "/data"]

CMD ["/bin/bash", "deploy/init.sh"]