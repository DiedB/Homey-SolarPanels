'use strict';

const Homey = require('homey');
const { GoodWeApi } = require('./api');

class GoodWe extends Homey.Driver {
    onPair(socket) {
        let goodWeApi;
        let username;
        let password;

        socket.on('login', async (credentials, callback) => {
            try {
                username = credentials.username;
                password = credentials.password;
                goodWeApi = new GoodWeApi(username, password);

                await goodWeApi.refreshToken();

                callback(null, true);
            } catch (error) {
                this.error(error);
                callback(new Error(Homey.__('login_error')));
            }
        });

        socket.on('list_devices', async (_, callback) => {
            try {
                const systems = await goodWeApi.getSystems();

                const promises = systems.data.map(system => {
                    return new Promise(async (resolve, reject) => {
                        try {
                            resolve(await goodWeApi.getInverterData(system.powerstation_id))
                        } catch (error) {
                            reject(error)
                        }
                    })
                })
                const systemData = await Promise.all(promises);

                const devices = []
                systemData.forEach(system => {
                    const systemId = system.data.info.powerstation_id;
                    const stationName = system.data.info.stationname;
                    const checkDelay = Math.random() * 10 * 1000;

                    system.data.inverter.forEach((inverter, index) => {
                        let device = {
                            name: `${stationName} (${inverter.sn})`,
                            data: {
                                systemId,
                                inverterId: inverter.sn,
                                checkDelay: checkDelay + (index * 3 * 1000),
                                hasStorage: inverter.is_stored
                            },
                            settings: { username, password }
                        };

                        // Add battery capability if system has storage enabled
                        if (device.data.hasStorage) {
                            device.capabilities = ['measure_battery', 'measure_power', 'meter_power'];
                        }

                        devices.push(device);
                    })
                })

                callback(null, devices);
            } catch (error) {
                this.error(error);
                callback(error);
            }
        });
    }
}

module.exports = GoodWe;