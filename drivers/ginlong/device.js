'use strict';

const Inverter = require('../inverter');
const { GinlongApi } = require('./api');

class Ginlong extends Inverter {
    onInit() {
        super.onInit();

        const data = this.getData();
        this.ginlongApi = new GinlongApi(data.plantId);
    }

    getCronString() {
        return '* * * * *';
    }

    async checkProduction() {
        this.log('Checking production');

        const data = this.getData();

        try {
            const productionData = await this.ginlongApi.getProductionData(data.id);

            if (!this.getAvailable()) {
                await this.setAvailable();
            }
            
            const currentEnergy = Number(productionData.realTimeDataImp.find(data => data.key === '1bd').value);
            this.setCapabilityValue('daily_production', currentEnergy);

            const currentPower = Number(productionData.realTimeDataImp.find(data => data.key === '1ao').value);
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
