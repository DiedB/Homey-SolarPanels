'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

const pathName = '/solar_api/v1/GetInverterRealtimeData.cgi?Scope=Device&DeviceID=1&DataCollection=CommonInverterData';

class Fronius extends Homey.Driver {
    onPair(socket) {

        this.log('Started pairing');

        socket.on('validate', (device, callback) => {
            const validationUrl = `http://${device.data.ip}${pathName}`;

            fetch(validationUrl)
                .then(result => {
                    if (result.ok) {
                        callback(null, true);
                    } else {
                        callback(Homey.__('ip_error'));
                    }
                }).catch(error => {
                    this.log(error);
                    callback(Homey.__('network_error'));
                });
        });
    }
}

module.exports = Fronius;