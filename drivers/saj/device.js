'use strict';

const Inverter = require('../inverter');
const fetch = require('node-fetch');
const parseString = require('xml2js').parseString;

const pathName = '/real_time_data.xml';

class SAJ extends Inverter {
    getCronString() {
        return '*/10 * * * * *';
    }

    checkProduction() {
        this.log('Checking production');

        const settings = this.getSettings();
        var dataUrl = `http://${settings.ip}${pathName}`;

        fetch(dataUrl)
            .then(result => {
                if (result.ok) {
                    if (!this.getAvailable()) {
                        this.setAvailable().then(_ => {
                            this.log('Available');
                        }).catch(error => {
                            this.error('Setting availability failed');
                        })
                    }

                    return result.text();
                } else {
                    throw result.status;
                }
            })
            .then(response => {
                parseString(response, (_, result) => {
                    const parsedResult = result.real_time_data;

                    const currentEnergy = Number(parsedResult['e-today'][0]);
                    this.setCapabilityValue('daily_production', currentEnergy);
    
                    const currentPower = Number(parsedResult['p-ac'][0]);
                    this.setCapabilityValue('production', currentPower);

                    this.log(`Current energy is ${currentEnergy}kWh`);
                    this.log(`Current power is ${currentPower}W`);
                });
            })
            .catch(error => {
                this.log(`Unavailable (${error})`);
                this.setUnavailable(`Error retrieving data (${error})`);
            });
    }
}

module.exports = SAJ;