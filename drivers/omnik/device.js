'use strict';

const Inverter = require('../inverter');
const { OmnikApi } = require('./api');

class Omnik extends Inverter {
    async onInit() {
        super.onInit();

        const settings = this.getSettings();

        this.omnikApi = new OmnikApi(settings.username, settings.password);
        await this.omnikApi.initializeSession();
    }

    async onSettings(_, newSettings) {
        const data = this.getData();

        // Omnik API will throw an error if new settings are invalid
        const omnikApi = new OmnikApi(newSettings.username, newSettings.password);
        await omnikApi.getProductionData(data.id);

        this.omnikApi = omnikApi;
    }

    async checkProduction() {
        this.log('Checking production');

        const data = this.getData();

        try {
            const productionData = await this.omnikApi.getProductionData(data.id);
    
            if (!this.getAvailable()) {
                await this.setAvailable();
            }

            const currentEnergy = productionData.data.today_energy;
            this.setCapabilityValue('daily_production', currentEnergy);

            const currentPower = productionData.data.current_power * 1000;
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