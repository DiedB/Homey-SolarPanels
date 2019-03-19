'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

const baseUrl = 'http://www.solarinfobank.com/openapi/loginvalidV2';

class Sungrow extends Homey.Driver {
    onPair(socket) {
        socket.on('validate', (device, callback) => {
            const validationUrl = `${baseUrl}?username=${device.data.username}&password=${device.data.password}`;

            fetch(validationUrl)
                .then(result => {
                    if (result.ok && !result.json().code) {
                        callback(null, true);
                    } else {
                        callback(Homey.__('login_error'));
                    }
                }).catch(error => {
                    callback(Homey.__('network_error'));
                });
        });
    }
}

module.exports = Sungrow;