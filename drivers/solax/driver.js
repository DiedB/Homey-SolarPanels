'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

const baseUrl = 'https://www.solax-portal.com/api/v1/';

class Solax extends Homey.Driver {
    onPair(socket) {
        socket.on('validate', (device, callback) => {
            const validationUrl = `${baseUrl}user/Login?username=${device.data.username}&password=${device.data.password}`;

            fetch(validationUrl)
                .then(result => {
                    return result.json();
                })
                .then(response => {
                    if (response.successful === true) {
                        callback(true);
                    } else {
                        callback(Homey.__('login_error'));
                    }
                }).catch(error => {
                    callback(Homey.__('network_error'));
                });
        });
    }
}

module.exports = Solax;