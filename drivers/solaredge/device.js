'use strict';

const Inverter = require('../inverter');
const fetch = require('node-fetch');

const baseUrl = 'https://monitoringapi.solaredge.com/site/';

class SolarEdge extends Inverter {
    checkProduction() {
        this.log('Checking production');

        const data = this.getData();
        const dataUrl = `${baseUrl}${data.sid}/overview?api_key=${data.key}&format=json`;

        fetch(dataUrl)
            .then(result => {
                if (result.ok || result.status === 304) {
                    if (!this.getAvailable()) {
                        this.setAvailable().then(result => {
                            this.log('Available');
                        }).catch(error => {
                            this.error('Setting availability failed');
                        })
                    }

                    return result.json();
                } else {
                    throw result.status;
                }
            })
            .then(response => {
                const lastUpdate = response.overview.lastUpdateTime;

                if (lastUpdate !== this.getStoreValue('lastUpdate')) {
                    this.setStoreValue('lastUpdate', lastUpdate).catch(error => {
                        this.error('Failed setting last update value');
                    });

                    const currentEnergy = Number(response.overview.lastDayData.energy) / 1000;
                    this.setCapabilityValue('meter_power', currentEnergy);

                    const currentPower = Number(response.overview.currentPower.power);
                    this.setCapabilityValue('measure_power', currentPower);

                    this.log(`Current energy is ${currentEnergy}kWh`);
                    this.log(`Current power is ${currentPower}W`);
                } else {
                    this.log(`No new data`);
                }
            })
            .catch(error => {
                this.log(`Unavailable (${error})`);
                this.setUnavailable(`Error retrieving data (HTTP ${error})`);
            });
    }
}

module.exports = SolarEdge;