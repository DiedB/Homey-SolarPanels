'use strict';

const Homey = require('homey');
const { GinlongApi } = require('./api');

class Ginlong extends Homey.Driver {
    onPair(socket) {
        let ginlongApi;
        let userId;
        let plantId;
        let systems;

        socket.on('validate', async (pairData, callback) => {
            try {
                userId = pairData.uid;
                plantId = pairData.plant;
                ginlongApi = new GinlongApi(userId, plantId);

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
                    name: system.system_name,
                    data: {
                        id: system.system_id
                    },
                    settings: { uid: userID, plant: plantID }
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
