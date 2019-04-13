'use strict';

const Inverter = require('../inverter');
const fetch = require('node-fetch');

const baseUrl = 'https://api2.tigoenergy.com/api/v3';

class Tigo extends Inverter {
    async checkProduction() {
        this.log('Checking production');

        const data = this.getData();
        const settings = this.getSettings();
        const dataUrl = `${baseUrl}/data/summary?system_id=${data.sid}`;
        const authorizationHeader = `Basic ${Buffer.from(`${settings.username}:${settings.password}`).toString('base64')}`;
        
        try {
            const productionResponse = await fetch(dataUrl, {
                headers: {
                  'Authorization': authorizationHeader, 
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            const productionData = await productionResponse.json();
    
            if (productionResponse.ok) {
                if (!this.getAvailable()) {
                    this.setAvailable().then(result => {
                        this.log('Available');
                    }).catch(error => {
                        this.error('Setting availability failed');
                    })
                }
    
                const currentEnergy = Number(productionData.summary.daily_energy_dc) / 1000;
                this.setCapabilityValue('meter_power.production', currentEnergy);
    
                const currentPower = Number(productionData.summary.last_power_dc);
                this.setCapabilityValue('measure_power.production', currentPower);
                
                this.log(`Current energy is ${currentEnergy}kWh`);
                this.log(`Current power is ${currentPower}W`);
            } else {
                throw new Error('Invalid Tigo API response');
            }
        } catch (error) {
            this.log(`Unavailable (${error})`);
            this.setUnavailable(`Error retrieving data (${error})`);
        };
    }
}

module.exports = Tigo;