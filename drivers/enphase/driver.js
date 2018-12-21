'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

const baseUrl = 'https://api.enphaseenergy.com/api/v2/systems/';

class SolarEdge extends Homey.Driver {
    onPair(socket) {
        socket.on('validate', (device, callback) => {
            const validationUrl = `${baseUrl}${device.data.sid}/summary?key=${device.data.key}&user_id=${device.data.uid}`;

            fetch(validationUrl)
                .then(result => {
                    if (result.ok) {
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

module.exports = SolarEdge;