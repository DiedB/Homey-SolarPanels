'use strict';

const Homey = require('homey');
const { OmnikApi } = require('./api');

class Omnik extends Homey.Driver {
    onPair(socket) {
        let username;
        let password;
        let omnikApi;

        socket.on('login', async (credentials, callback) => {
            try {
                username = credentials.username;
                password = credentials.password;

                omnikApi = new OmnikApi(username, password);
                await omnikApi.initializeSession();

                callback(null, true);
            } catch (error) {
                this.error(error);
                callback(error);
            }
        });

        socket.on('list_devices', async (_, callback) => {
            try {
                const systems = await omnikApi.getSystems();

                const devices = systems.data.plants.map(system => ({
                    name: system.name,
                    data: {
                        id: system.plant_id
                    },
                    settings: { username, password }
                }));

                callback(null, devices);
            } catch (error) {
                this.error(error);
                callback(error);
            }
        });
    }
}

module.exports = Omnik;