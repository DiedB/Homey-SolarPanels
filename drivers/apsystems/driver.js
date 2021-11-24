'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');
const apsystems = require('apsystems');

class APsystems extends Homey.Driver {
    onPair(socket) {
        socket.on('validate', (device, callback) => {

            const ecur = new apsystems.ECUR(device.settings.ip, 8899);
            ecur.getECUdata(function(err, data) {
                if (err !== null) return callback(new Error(Homey.__('ip_error')));
                callback(null, true);
            });
        });
    }
}

module.exports = APsystems;
