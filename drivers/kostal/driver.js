'use strict';

const Homey = require('homey');
const { KostalApi } = require('./api');

class Kostal extends Homey.Driver {
    onPair(socket) {
        socket.on('validate', async (pairData, callback) => {
            try {
                const kostalApi = new KostalApi(pairData.ipAddress, pairData.password, this.log);
                
                await kostalApi.login()
                const systemInfo = await kostalApi.getInfo();
                const serialNumber = await kostalApi.getInverterSerialNumber();

                callback(null, { systemInfo, serialNumber });
            } catch (error) {
                this.error(error);
                callback(error);
            }
        });
    }
}

module.exports = Kostal;