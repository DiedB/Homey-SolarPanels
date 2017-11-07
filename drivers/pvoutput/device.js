'use strict';

const Inverter = require('../inverter');
const fetch = require('node-fetch');

const baseUrl = 'http://pvoutput.org/service/r2/getstatus.jsp';

class PVOutput extends Inverter {
    checkProduction() {
        this.log('Checking production');

        const data = this.getData();
        var dataUrl = `${baseUrl}?key=${data.key}&sid=${data.sid}`;

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

                    return result.text();
                } else {
                    throw result.status;
                }
            })
            .then(body => {
                const parsedResponse = body.split(',');
                const lastUpdate = `${parsedResponse[0]} ${parsedResponse[1]}`;

                if (lastUpdate !== this.getStoreValue('lastUpdate')) {
                    this.setStoreValue('lastUpdate', lastUpdate).catch(error => {
                        this.error('Failed setting last update value');
                    });

                    const currentEnergy = Number(parsedResponse[2]) / 1000;
                    this.setCapabilityValue('meter_power', currentEnergy);

                    const currentPower = Number(parsedResponse[3]);
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

module.exports = PVOutput;