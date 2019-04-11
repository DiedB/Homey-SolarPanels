'use strict';

const Inverter = require('../inverter');
const fetch = require('node-fetch');

const baseUrl = 'https://api.enphaseenergy.com/api/v2/systems/';

class Enphase extends Inverter {
    checkProduction() {
        this.log('Checking production');

        const data = this.getData();
        const settings = this.getSettings();
        const dataUrl = `${baseUrl}${data.sid}/summary?key=${settings.key}&user_id=${settings.uid}`;

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
                const lastUpdate = response.last_report_at;

                if (lastUpdate !== this.getStoreValue('lastUpdate')) {
                    this.setStoreValue('lastUpdate', lastUpdate).catch(error => {
                        this.error('Failed setting last update value');
                    });

                    const currentEnergy = Number(response.energy_today) / 1000;
                    this.setCapabilityValue('meter_power.production', currentEnergy);

                    const currentPower = Number(response.current_power);
                    this.setCapabilityValue('measure_power.production', currentPower);

                    this.log(`Current energy is ${currentEnergy}kWh`);
                    this.log(`Current power is ${currentPower}W`);
                } else {
                    this.log(`No new data`);
                }
            })
            .catch(error => {
                this.log(`Unavailable (${error})`);
                this.setUnavailable(`Error retrieving data (${error})`);
            });
    }
}

module.exports = Enphase;