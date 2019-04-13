'use strict';

const Inverter = require('../inverter');
const fetch = require('node-fetch');
const parseString = require('xml2js').parseString;

const pathName = '/real_time_data.xml';

class SAJ extends Inverter {
    getCronString() {
        return '* * * * *';
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
                    this.setCapabilityValue('meter_power.production', currentEnergy);
    
                    const currentPower = Number(parsedResult['p-ac'][0]);
                    this.setCapabilityValue('measure_power.production', currentPower);

                    const currentGridVoltage = Number(parsedResult['v-grid'][0]);
                    this.setCapabilityValue('measure_voltage.grid', currentGridVoltage);
    
                    this.log(`Current energy is ${currentEnergy}kWh`);
                    this.log(`Current power is ${currentPower}W`);
                    this.log(`Current grid voltage is ${currentGridVoltage}V`);
                });
            })
            .catch(error => {
                this.log(`Unavailable (${error})`);
                this.setUnavailable(`Error retrieving data (${error})`);
            });
    }
}

module.exports = SAJ;