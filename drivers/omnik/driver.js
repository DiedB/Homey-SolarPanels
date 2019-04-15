'use strict';

const Homey = require('homey');
const { getUserId, getPlantList } = require('./api');

class Omnik extends Homey.Driver {
    onPair(socket) {
        let userId;
        let username;
        let password;

        socket.on('validate', async (pairData, callback) => {
            username = pairData.username;
            password = pairData.password;

            try {
                userId = await getUserId(pairData.username, pairData.password);
                callback(null, true);
            } catch (error) {
                this.error(error);
                callback(error);
            }
        });

        socket.on('list_devices', async (_, callback) => {
            try {
                const plants = await getPlantList(userId);

                const devices = plants.data.plants.map(currentPlant => ({
                    name: currentPlant.name,
                    data: {
                        id: currentPlant.plant_id
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