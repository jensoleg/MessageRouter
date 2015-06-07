'use strict';

var request = require('request'),
  _ = require('lodash'),
  Installation = require('devices'),
  operators = {
    lt: '<',
    lte: '<=',
    gt: '>',
    gte: '>=',
    eq: '=='
  };

function Triggers(connection) {

  this.handle = function (topic, message) {
    // parse topic
    var topics = topic.split('/'),
      domain = topics[1],
      deviceId = topics[2],
      stream = topics[3],

      installation = new Installation(connection, domain + '.installation');

    // find device
    installation.findDevice(deviceId, function (error, device) {
      if (!error && device) {
        var index = 0,
          doActivate;

        /* run through triggers and match stream topic */
        _.each(device.triggers, function (trigger) {
          if (trigger.stream_id === stream) {


            _.each(trigger.requests, function (httpRequest) {
              // evaluate expression
              doActivate = eval(message + operators[trigger.trigger_type] + trigger.threshold_value);

              if (doActivate) {

                if (_.isEmpty(trigger.triggered_value) || _.isUndefined(trigger.triggered_value)) {
                  installation.updateTriggerValue(device.id, index, message, function (error) {
                    if (!error) {
                      // perform request
                      request(httpRequest.request_options, function (error, response, body) {
                        if (error) {
                          console.log('Request error: ', error);
                        } else {
                          console.log('Request response: ', body);
                        }
                      });
                    }
                  });

                }
              } else {
                installation.updateTriggerValue(device.id, index, undefined, function (error) {
                });
              }
            });
          }
          index++;
        });
      }
    });
  };
}

Triggers.prototype.handle = function () {

  var self = this;

  return function (packet, client) {

    self.handle(packet, client, function (send, err) {
    });
  };
};

module.exports = Triggers;