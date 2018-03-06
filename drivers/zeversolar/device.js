'use strict';

const Inverter = require('../inverter');
const fetch = require('node-fetch');

const baseUrl = 'https://www.zevercloud.com/api/v1';

class Zeversolar extends Inverter {
    async checkProduction() {
        this.log('Checking production');

        const data = this.getData();
        const dataUrl = `${baseUrl}/getPlantOverview?key=${data.key}`;
        
        try {
            const productionResponse = await fetch(dataUrl);
            const productionData = await productionResponse.json();
    
            if (productionResponse.ok) {
                if (!this.getAvailable()) {
                    this.setAvailable().then(result => {
                        this.log('Available');
                    }).catch(error => {
                        this.error('Setting availability failed');
                    })
                }
    
                const currentEnergy = productionData['E-Today'].value;
                this.setCapabilityValue('meter_power', currentEnergy);
    
                const currentPower = productionData['Power'].value;
                this.setCapabilityValue('measure_power', currentPower);
                
                this.log(`Current energy is ${currentEnergy}kWh`);
                this.log(`Current power is ${currentPower}W`);
            } else {
                throw new Error('Invalid Zevercloud API response');
            }
        } catch (error) {
            this.log(`Unavailable (${error})`);
            this.setUnavailable(`Error retrieving data (${error})`);
        };
    }
}

module.exports = Zeversolar;