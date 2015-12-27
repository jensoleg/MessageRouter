cd /tmp

# try to remove the repo if it already exists

rm -rf alarmrouter; true

git clone https://github.com/jensoleg/alarmrouter.git

cd ./alarmrouter

npm install --unsafe-perm --production

if [ -z "$APP" ]; then
    export APP=app.js
fi

# wait on MOsca server startup
sleep 120

MQTT_USER_NAME=$MQTT_USER_NAME MQTT_PASSWORD=$MQTT_PASSWORD pm2 start -x $APP  --no-daemon