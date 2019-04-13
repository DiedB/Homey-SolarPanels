'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

const baseUrl = 'http://pvoutput.org/service/r2/getstatus.jsp';

class PVOutput extends Homey.Driver {
    onPair(socket) {
        socket.on('validate', (device, callback) => {
            const validationUrl = `${baseUrl}?key=${device.settings.key}&sid=${device.data.sid}`;

            fetch(validationUrl)
                .then(result => {
                    if (result.ok || result.status === 304) {
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

module.exports = PVOutput;