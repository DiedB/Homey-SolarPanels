'use strict';

const Homey = require('homey');
const { SolaxApi } = require('./api');

class Solax extends Homey.Driver {
    onPair(socket) {
        socket.on('validate', async (pairData, callback) => {
            try {
                const solaxApi = new SolaxApi(pairData.tokenId, pairData.regNo);
                const data = await solaxApi.getProductionData();

                callback(null, data.result);
            } catch (error) {
                this.error(error);
                callback(error);
            }
        });
    }
}

module.exports = Solax;