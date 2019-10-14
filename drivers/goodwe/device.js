'use strict';

const Inverter = require('../inverter');
const { GoodWeApi } = require('./api');

class GoodWe extends Inverter {
    onInit() {
        super.onInit();

        const data = this.getData();
        const settings = this.getSettings();
        this.goodWeApi = new GoodWeApi(settings.username, settings.password, data.systemId);

        this.goodWeApi.refreshToken();
    }

    getCronString() {
        return '* * * * *';
    }

    async onSettings(_, newSettings) {
        const data = this.getData();

        // GoodWe API will throw an error if new settings are invalid
        const goodWeApi = new GoodWeApi(newSettings.username, newSettings.password, data.systemId);

        this.goodWeApi = goodWeApi;
    }

    async checkProduction() {
        this.log('Checking production');
        const data = this.getData();

        try {
            const productionData = await this.goodWeApi.getInverterData();
            const inverterData = productionData.data.inverter.find(inverter => inverter.sn === data.inverterId);

            this.log(inverterData);

            const currentEnergy = inverterData.eday;
            const currentPower = inverterData.out_pac;
            
            this.setCapabilityValue('daily_production', currentEnergy);
            this.setCapabilityValue('production', currentPower);    

            if (!this.getAvailable()) {
                await this.setAvailable();
            }

            this.log(`Current energy is ${currentEnergy}kWh`);
            this.log(`Current power is ${currentPower}W`);
        } catch (error) {
            this.log(`Unavailable (${error})`);
            this.setUnavailable(`Error retrieving data (${error})`);
        }
    }
}

module.exports = GoodWe;