'use strict';

const Inverter = require('../inverter');
const fetch = require('node-fetch');

const baseUrl = 'http://www.solarinfobank.com/openapi/loginvalidV2';

class Sungrow extends Inverter {
    getCronString() {
        return '* * * * *';
    }

    checkProduction() {
        this.log('Checking production');

        const data = this.getData();
        const dataUrl = `${baseUrl}?username=${data.username}&password=${data.password}`;

        fetch(dataUrl)
            .then(result => {
                if (result.ok) {
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
                const lastUpdate = `${response.todayEnergy} ${response.power}`;

                if (lastUpdate !== this.getStoreValue('lastUpdate')) {
                    this.setStoreValue('lastUpdate', lastUpdate).catch(error => {
                        this.error('Failed setting last update value');
                    });

                    const currentEnergy = response.todayEnergy;
                    this.setCapabilityValue('meter_power', currentEnergy);

                    const currentPower = response.power * 1000;
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

module.exports = Sungrow;