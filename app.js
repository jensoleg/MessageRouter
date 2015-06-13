'use strict';

var mqtt = require('mqtt'),
    mongoose = require('mongoose'),
    _ = require('lodash'),
    uriUtil = require('mongodb-uri'),
    Triggers = require('./app/router.js'),
    Installations = require('devices'),
    config = require('./config.json'),

    mongodbDeviceUri = config.mongodb.dbConnection + config.mongodb.db,
    mongooseDeviceUri = uriUtil.formatMongoose(mongodbDeviceUri);

config.mqtt.options.username = process.env.MQTT_USER_NAME + '/' + config.domain;
config.mqtt.options.password = process.env.MQTT_PASSWORD;

console.info('config mqtt : ', config.mqtt);

if (process.env.MQTT_PORT_1883_TCP_ADDR) {
    config.mqtt.host = process.env.MQTT_PORT_1883_TCP_ADDR;
    config.mqtt.port = process.env.MQTT_PORT_1883_TCP_PORT;
}

var client = mqtt.connect('mqtt://' + config.mqtt.host + ':' + config.mqtt.port, config.mqtt.options),
    deviceConnection = mongoose.createConnection(mongooseDeviceUri, config.mongodb.options),
    triggers = new Triggers(deviceConnection),
    installations = new Installations(deviceConnection, config.domain + '.installation'),
    subscriptions = [];

console.info('Start app mqtt : ', config.mqtt);

installations.allTrigger(function (error, result) {
    console.info('subscriptions: ', result);
    subscriptions = result;
});

client.on('connect', function () {
    _.each(subscriptions, function (sub) {
        client.subscribe('/' + config.domain + '/' + sub.deviceId + '/' + sub.control);
        console.info('subscribed to : ', '/' + config.domain + '/' + sub.deviceId + '/' + sub.control);
    });
    console.log('connected');
});

client.on('error', function () {
    console.info('connect failed');
});

client.on('close', function () {
    console.info('client disconnetced');
});

client.on('message', function (topic, message) {
    console.info('Event Published: ' + topic + ' Message :' + message);
    triggers.handle(topic, message);
});