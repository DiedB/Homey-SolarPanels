"use strict";

const Inverter = require("../../inverter");
const { OmnikLocalApi } = require("./api");

class OmnikLocal extends Inverter {
    async onInit() {
        super.onInit();

        const settings = this.getSettings();
        const data = this.getData();

        this.omnikLocalApi = new OmnikLocalApi(settings.ip, data.id);
    }

    async onSettings(_, newSettings) {
        const data = this.getData();

        this.omnikLocalApi = new OmnikLocalApi(newSettings.ip, data.id);
    }

    getCronString() {
        return "*/5 * * * * *";
    }

    async checkProduction() {
        this.log("Checking production");

        try {
            const {
                inverterName: _,
                currentPower,
                currentVoltage,
                dailyProduction,
            } = await this.omnikLocalApi.getData();

            await this.setCapabilityValue("meter_power", dailyProduction);
            await this.setCapabilityValue("measure_voltage", currentVoltage);
            await this.setCapabilityValue("measure_power", currentPower);

            if (!this.getAvailable()) {
                await this.setAvailable();
            }
        } catch (error) {
            this.error(`Unavailable (${error})`);
            this.setUnavailable(`Error retrieving data (${error})`);
        }
    }
}

module.exports = OmnikLocal;
