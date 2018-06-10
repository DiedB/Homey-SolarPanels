'use strict';

const Inverter = require('../inverter');
const fetch = require('node-fetch');

const baseUrl = 'https://eu.goodwe-power.com/Mobile/';

class GoodWe extends Inverter {
    checkProduction() {
        this.log('Checking production');
        
        const data = this.getData();
        const dataUrl = `${baseUrl}GetMyPowerStationById?stationId=${data.sid}`;
        
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
                const currentEnergy = Number(response.eday.replace(/[^\d.-]/g, ''));
                this.setCapabilityValue('meter_power', currentEnergy);
                
                const currentPower = Number(response.curpower.replace(/[^\d.-]/g, '')) * 1000;
                this.setCapabilityValue('measure_power', currentPower);
                
                this.log(`Current energy is ${currentEnergy}kWh`);
                this.log(`Current power is ${currentPower}W`);
            })
            .catch(error => {
                this.log(`Unavailable (${error})`);
                this.setUnavailable(`Error retrieving data (HTTP ${error})`);
            });
    }
}

module.exports = GoodWe;