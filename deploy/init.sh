#!/bin/bash

if [ ! -f /config/config.js ]; then
	cp /usr/src/app/config.js /config/config.js
fi

cd /usr/src/app/
node app.js