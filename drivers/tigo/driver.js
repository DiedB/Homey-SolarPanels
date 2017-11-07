'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

const baseUrl = 'https://api2.tigoenergy.com/api/v3';

class Tigo extends Homey.Driver {
    onPair(socket) {
        socket.on('validate', async (device, callback) => {
            try {
                const authorizationHeader = `Basic ${Buffer.from(`${device.data.username}:${device.data.password}`).toString('base64')}`;
                const validationResponse = await fetch(`${baseUrl}/data/summary?system_id=${device.data.sid}`, {
                    headers: {
                        'Authorization': authorizationHeader,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                const validationData = await validationResponse.json();
                
                if (validationData.summary) {
                    callback(true);
                } else {
                    callback(Homey.__('login_error'));
                }
            } catch (error) {
                callback(Homey.__('network_error'));                
            }
        });
    }
}

module.exports = Tigo;