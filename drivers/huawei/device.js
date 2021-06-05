"use strict";

const Inverter = require("../../inverter");
const { HuaweiModbusApi } = require("./api");

class Huawei extends Inverter {
    async onInit() {
        super.onInit();

        const settings = this.getSettings();

        this.huaweiModbusApi = new HuaweiModbusApi(settings.ip);
    }

    async onSettings(_, newSettings) {
        this.huaweiModbusApi = new HuaweiModbusApi(newSettings.ip);
    }

    getCronString() {
        return "*/15 * * * * *";
    }

    async checkProduction() {
        this.log("Checking production");

        try {
            const {
                currentPower,
                currentVoltage,
                dailyProduction,
                currentTemperature,
            } = await this.huaweiModbusApi.getData();

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

module.exports = Huawei;
