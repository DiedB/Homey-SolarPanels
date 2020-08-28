'use strict';

const Inverter = require('../../inverter');
const { KostalApi } = require('./api');

class Kostal extends Inverter {
    async onInit() {
        super.onInit();

        const settings = this.getSettings();

        try {
            this.kostalApi = new KostalApi(settings.ipAddress, settings.password, this.log);
            await this.kostalApi.login();
        } catch (error) {
            this.setUnavailable(error);
        }
    }

    getCronString() {
        return '*/5 * * * * *';
    }

    async onSettings(_, newSettings) {
        const data = this.getData();

        const kostalApi = new KostalApi(newSettings.ipAddress, newSettings.password, this.log);
        await kostalApi.login()

        this.kostalApi = kostalApi;
        this.setAvailable();
    }

    async checkProduction() {
        this.log('Checking production');

        if (this.kostalApi && this.kostalApi.hasValidSession()) {
            try {
                const currentEnergy = await this.kostalApi.getProductionData();
                const currentPower = await this.kostalApi.getPowerData();
    
                this.setCapabilityValue('meter_power', currentEnergy / 1000);
                this.setCapabilityValue('measure_power', currentPower);    
    
                if (!this.getAvailable()) {
                    await this.setAvailable();
                }
    
                this.log(`Current energy is ${currentEnergy / 1000}kWh`);
                this.log(`Current power is ${currentPower}W`);
            } catch (error) {
                this.log(`Unavailable (${error})`);
                this.setUnavailable(error);
            }
        }
    }
}

module.exports = Kostal;