'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

const baseUrl = 'https://www.zevercloud.com/api/v1';

class Zeversolar extends Homey.Driver {
    onPair(socket) {
        socket.on('validate', async (device, callback) => {
            try {
                const validationResponse = await fetch(`${baseUrl}/getPlantOverview?key=${device.data.key}`);
                const validationData = await validationResponse.json();
                
                if (validationData.code !== -1) {
                    callback(null, true);
                } else {
                    callback(Homey.__('login_error'));
                }
            } catch (error) {
                callback(Homey.__('network_error'));                
            }
        });
    }
}

module.exports = Zeversolar;