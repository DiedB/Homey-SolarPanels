'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

const baseUrl = 'https://api.enphaseenergy.com/api/v2/systems/';

class Enphase extends Homey.Driver {
    onPair(socket) {
        socket.on('validate', (device, callback) => {
            const validationUrl = `${baseUrl}${device.data.sid}/summary?key=${device.settings.key}&user_id=${device.settings.uid}`;

            fetch(validationUrl)
                .then(result => {
                    if (result.ok) {
                        callback(null, true);
                    } else {
                        callback(new Error(Homey.__('login_error')));
                    }
                }).catch(error => {
                    callback(new Error(Homey.__('network_error')));
                });
        });
    }
}

module.exports = Enphase;