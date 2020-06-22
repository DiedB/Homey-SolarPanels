'use strict';

const Inverter = require('../../inverter');
const fetch = require('node-fetch');

const pathName = '/solar_api/v1/GetInverterRealtimeData.cgi?Scope=System&DataCollection=CumulationInverterData';

class Fronius extends Inverter {
    getCronString() {
        return '*/30 * * * * *';
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

                    return result.json();
                } else {
                    throw result.status;
                }
            })
            .then(response => {
                const lastUpdate = response.Head.Timestamp;

                if (lastUpdate !== this.getStoreValue('lastUpdate')) {
                    this.setStoreValue('lastUpdate', lastUpdate).catch(error => {
                        this.error('Failed setting last update value');
                    });
					
					let x = 0;
					let currentEnergy = 0;
					
					for (x in response.Body.Data.DAY_ENERGY.Values) {
						currentEnergy += Number(response.Body.Data.DAY_ENERGY.Values[x] / 1000);
					}
					
                    this.setCapabilityValue('meter_power', currentEnergy);

                    x = 0;
					let currentPower = 0;
					
                    if (response.Body.Data.PAC) {
						for (x in response.Body.Data.PAC.Values) {
						currentPower += Number(response.Body.Data.PAC.Values[x]);
						}
					} else {
                        currentPower = null;
                    }
                    this.setCapabilityValue('measure_power', currentPower);    

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

module.exports = Fronius;