'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

const baseUrl = 'https://eu.goodwe-power.com/Mobile/';

class GoodWe extends Homey.Driver {
    onPair(socket) {
        let systemData = {};
        
        socket.on('validate', (data, callback) => {
            const validationUrl = `${baseUrl}GetMyPowerStationByUser?userName=${data.username}`;
            
            fetch(validationUrl)
                .then(result => {
                    if (result.ok) {
                        result.json().then(json => systemData = json);
                        callback(true);
                    } else {
                        callback(Homey.__('login_error'));
                    }
                }).catch(error => {
                    callback(Homey.__('network_error'));
                });
        });
        
        socket.on('list_devices', (data, callback) => {
            const devicesList = systemData.reduce((devices, currentInverter) => {
                devices.push({
                    name: currentInverter.stationName,
                    data: {
                        sid: currentInverter.stationId,
                    }
                });
                return devices;
            }, []);
            
            callback(null, devicesList);
        });
    }
}

module.exports = GoodWe;