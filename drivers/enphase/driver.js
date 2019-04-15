'use strict';

const Homey = require('homey');
const { EnphaseApi } = require('./api');

class Enphase extends Homey.Driver {
    onPair(socket) {
        let enphaseApi;
        let userId;
        let apiKey;
        let systems;

        socket.on('validate', async (pairData, callback) => {
            try {
                userId = pairData.uid;
                apiKey = pairData.key;
                enphaseApi = new EnphaseApi(userId, apiKey);

                systems = await enphaseApi.getSystems();

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
                    settings: { uid: userId, key: apiKey }
                }));

                callback(null, devices);
            } catch (error) {
                this.error(error);
                callback(error);
            }
        });
    }
}

module.exports = Enphase;