'use strict';

const Homey = require('homey');
const { GoodWeApi } = require('./api');

class GoodWe extends Homey.Driver {
    onPair(socket) {
        let goodWeApi;
        let username;
        let password;
        let systems;

        socket.on('login', async (credentials, callback) => {
            try {
                username = credentials.username;
                password = credentials.password;
                goodWeApi = new GoodWeApi(username, password);

                systems = await goodWeApi.getToken();
                this.log(systems);

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

module.exports = GoodWe;