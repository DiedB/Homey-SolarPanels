'use strict';

const Homey = require('homey');
const { GinlongApi } = require('./api');

class Ginlong extends Homey.Driver {
    onPair(socket) {
        let ginlongApi;
        let plantId;
        let systems;

        socket.on('validate', async (pairData, callback) => {
            try {
                plantId = pairData.plant;
                ginlongApi = new GinlongApi(plantId, this.log);

                systems = await ginlongApi.getSystems();

                callback(null, true);
            } catch (error) {
                this.error(error);
                callback(error);
            }
        });

        socket.on('list_devices', (_, callback) => {
            try {
                const devices = systems.map(system => ({
                    name: system.name,
                    data: {
                        id: system.id,
                        plantId: plantId
                    },
                }));

                callback(null, devices);
            } catch (error) {
                this.error(error);
                callback(error);
            }
        });
    }
}

module.exports = Ginlong;
