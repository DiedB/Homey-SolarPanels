'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');
const uuid = require('uuid/v4');

const pathName = '/real_time_data.xml';

class SAJ extends Homey.Driver {
    onPair(socket) {
        socket.on('validate', (device, callback) => {
            const validationUrl = `http://${device.settings.ip}${pathName}`;

            fetch(validationUrl)
                .then(result => {
                    if (result.ok || result.status === 304) {
                        // Return a unique ID to the pairing view
                        callback(null, { id: uuid() });
                    } else {
                        callback(new Error(Homey.__('ip_error')));
                    }
                }).catch(error => {
                    callback(new Error(Homey.__('ip_error')));
                });
        });
    }
}

module.exports = SAJ;