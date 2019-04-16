'use strict';

const Inverter = require('../inverter');
const { GinlongApi } = require('./api');

class Ginlong extends Inverter {
    onInit() {
        super.onInit();

        const data = this.getData();
        const settings = this.getSettings();
        this.ginlongApi = new GinlongApi(settings.uid, data.id);
    }

    async onSettings(_, newSettings) {
        const data = this.getData();

        // Ginlong API will throw an error if new settings are invalid
        const ginlongApi = new GinlongApi(newSettings.uid, data.id);
        await ginlongApi.getProductionData();

        this.ginlongApi = ginlongApi;
    }

    async checkProduction() {
        this.log('Checking production');

        try {
            const productionJSON_Data = await this.ginlongApi.getProductionData();
            
            productionData = JSON.parse(productionJSON_Data);

           // const currentEnergy = productionData.reduce((lastValue, report) => lastValue + report.enwh, 0) / 1000;
           const currentEnergy = (productionData.energy_day);
           this.setCapabilityValue('daily_production', currentEnergy);

          //  const currentPower = productionData[productionData.length - 1].powr;
          const currentPower = (productionData.power);
          this.setCapabilityValue('production', currentPower);

            this.log(`Current energy is ${currentEnergy}kWh`);
            this.log(`Current power is ${currentPower}W`);
        } catch (error) {
            this.log(`Unavailable (${error})`);
            this.setUnavailable(`Error retrieving data (${error})`);
        }
    }
}

module.exports = Ginlong;
