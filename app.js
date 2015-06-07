'use strict';

var mqtt = require('mqtt'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  uriUtil = require('mongodb-uri'),
  Triggers = require('./app/router.js'),
  Installations = require('devices'),
  config = require('./config.json'),

  client = mqtt.connect('mqtt://' + config.mqtt.host + ':' + config.mqtt.port, config.mqtt.options),

  mongodbDeviceUri = config.mongodb.dbConnection + config.mongodb.db,
  mongooseDeviceUri = uriUtil.formatMongoose(mongodbDeviceUri);

  config.mongodb.options.username = process.env.MQTT_USER_NAME;
  config.mongodb.options.password = process.env.MQTT_PASSWORD;

  var deviceConnection = mongoose.createConnection(mongooseDeviceUri, config.mongodb.options),

  triggers = new Triggers(deviceConnection),
  installations = new Installations(deviceConnection, config.domain + '.installation'),
  subscriptions = [];

installations.allTrigger(function (error, result) {
  subscriptions = result;
});

client.on('connect', function () {
  _.each(subscriptions, function (sub) {
    client.subscribe('/' + config.domain + '/' + sub.deviceId + '/' + sub.control);
    console.log('subscribed to : ', '/' + config.domain + '/' + sub.deviceId + '/' + sub.control)
  });
  console.log('connected')
});

client.on('error', function () {
  console.log('connect failed');
});

client.on('message', function (topic, message) {
  console.log('Event Published: ' + topic + ' Message :' + message);
  triggers.handle(topic, message);
});