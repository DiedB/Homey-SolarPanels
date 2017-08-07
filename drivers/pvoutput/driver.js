'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

const baseUrl = 'http://pvoutput.org/service/r2/getstatus.jsp';

class PVOutput extends Homey.Driver {
    onPair(socket) {
        socket.on('validate', (data, callback) => {
            const validationUrl = `${baseUrl}?key=${data.key}&sid=${data.sid}`;

            fetch(validationUrl)
                .then(result => {
                    if (result.ok || result.status === 304) {
                        callback(null, true);
                    } else {
                        callback(Homey.__('login_error'), null);
                    }
                }).catch(error => {
                    callback(Homey.__('network_error'), null);
                });
        });
    }
}

module.exports = PVOutput;