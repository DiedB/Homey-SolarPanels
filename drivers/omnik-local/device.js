"use strict";

const Inverter = require("../../inverter");
const { OmnikLocalApi } = require("./api");

class OmnikLocal extends Inverter {
    async onInit() {
        super.onInit();

        const settings = this.getSettings();
        const data = this.getData();

        if (!this.hasCapability("measure_temperature")) {
            this.addCapability("measure_temperature");
        }

        this.omnikLocalApi = new OmnikLocalApi(settings.ip, data.id);
    }

    async onSettings(_, newSettings) {
        const data = this.getData();

        this.omnikLocalApi = new OmnikLocalApi(newSettings.ip, data.id);
    }

    getCronString() {
        return "*/15 * * * * *";
    }

    async checkProduction() {
        this.log("Checking production");

        try {
            const {
                inverterName: _,
                currentPower,
                currentVoltage,
                dailyProduction,
                currentTemperature,
            } = await this.omnikLocalApi.getData();

            await this.setCapabilityValue("meter_power", dailyProduction);
            await this.setCapabilityValue("measure_voltage", currentVoltage);
            await this.setCapabilityValue("measure_power", currentPower);
            await this.setCapabilityValue(
                "measure_temperature",
                currentTemperature
            );

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
