'use strict';

const Inverter = require('../../inverter');
const { SolaxApi } = require('./api');

class Solax extends Inverter {
    onInit() {
        super.onInit();

        const data = this.getData();
        const settings = this.getSettings();

        this.solaxApi = new SolaxApi(settings.tokenId, data.regNo);
    }

    getCronString() {
        return '* * * * *';
    }

    async onSettings(_, newSettings) {
        const data = this.getData();

        // Enphase API will throw an error if new settings are invalid
        const solaxApi = new SolaxApi(newSettings.tokenId, data.regNo);
        await solaxApi.getProductionData();

        this.solaxApi = solaxApi;
    }

    async checkProduction() {
        this.log('Checking production');

        try {
            const productionData = await this.solaxApi.getProductionData();

            let currentEnergy = 0;
            let currentPower = 0;

            currentEnergy = productionData.result.yieldtoday;
            currentPower = productionData.result.acpower;

            this.setCapabilityValue('meter_power', currentEnergy);
            this.setCapabilityValue('measure_power', currentPower);    

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

module.exports = Solax;