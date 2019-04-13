'use strict';

const Inverter = require('../inverter');
const fetch = require('node-fetch');

const pathName = '/solar_api/v1/GetInverterRealtimeData.cgi?Scope=Device&DeviceID=1&DataCollection=CommonInverterData';

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

                    const currentEnergy = Number(response.Body.Data.DAY_ENERGY.Value / 1000);
                    this.setCapabilityValue('daily_production', currentEnergy);

                    let currentPower;
                    if (response.Body.Data.PAC) {
                        currentPower = Number(response.Body.Data.PAC.Value);
                    } else {
                        currentPower = null;
                    }
                    this.setCapabilityValue('production', currentPower);    

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