'use strict';

const Homey = require('homey');

class Omnik extends Homey.Driver {
    onPair(socket) {
        socket.on('validate', (data, callback) => {
            callback(true);
        });
    }
}

module.exports = Omnik;