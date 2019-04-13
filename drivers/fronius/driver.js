'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

const pathName = '/solar_api/v1/GetInverterRealtimeData.cgi?Scope=Device&DeviceID=1&DataCollection=CommonInverterData';

class Fronius extends Homey.Driver {
    onPair(socket) {
        socket.on('validate', (device, callback) => {
            const validationUrl = `http://${device.settings.ip}${pathName}`;

            fetch(validationUrl)
                .then(result => {
                    if (result.ok) {
                        callback(null, true);
                    } else {
                        callback(new Error(Homey.__('login_error')));
                    }
                }).catch(error => {
                    callback(new Error(Homey.__('ip_error')));
                });
        });
    }
}

module.exports = Fronius;