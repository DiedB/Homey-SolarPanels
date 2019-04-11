'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

const pathName = '/real_time_data.xml';

class SAJ extends Homey.Driver {
    onPair(socket) {
        socket.on('validate', (device, callback) => {
            const validationUrl = `http://${device.settings.ip}${pathName}`;

            fetch(validationUrl)
                .then(result => {
                    if (result.ok || result.status === 304) {
                        callback(null, true);
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