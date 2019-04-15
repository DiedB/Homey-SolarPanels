'use strict';

const Inverter = require('../inverter');
const { getUserId, getPlantData } = require('./api');

class Omnik extends Inverter {
    getCronString() {
        return '*/5 * * * *';
    }

    async checkProduction() {
        this.log('Checking production');

        const data = this.getData();
        const settings = this.getSettings();

        try {
            const userId = await getUserId(settings.username, settings.password);
            const plantData = await getPlantData(userId, data.id);
    
            const currentEnergy = plantData.data.today_energy;
            this.setCapabilityValue('daily_production', currentEnergy);

            const currentPower = plantData.data.current_power * 1000;
            this.setCapabilityValue('production', currentPower);
            
            this.log(`Current energy is ${currentEnergy}kWh`);
            this.log(`Current power is ${currentPower}W`);
        } catch (error) {
            this.log(`Unavailable (${error})`);
            this.setUnavailable(`Error retrieving data (${error})`);
        };
    }

}

module.exports = Omnik;