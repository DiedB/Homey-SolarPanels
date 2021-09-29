"use strict";

const Inverter = require("../../inverter");
const fetch = require("node-fetch");

const pathName = "/status/status.php";

class ESolarWifiModule extends Inverter {
    getCronString() {
        return "*/10 * * * * *";
    }

    checkProduction() {
        this.log("Checking production");

        const settings = this.getSettings();
        var dataUrl = `http://${settings.ip}${pathName}`;

        fetch(dataUrl)
            .then((result) => {
                if (result.ok) {
                    if (!this.getAvailable()) {
                        this.setAvailable()
                            .then((_) => {
                                this.log("Available");
                            })
                            .catch((error) => {
                                this.error("Setting availability failed");
                            });
                    }
                    return result.text();
                } else {
                    throw result.status;
                }
            })
            .then((response) => {
                const parsedResult = response.split(",");

                const currentEnergy = Number(parsedResult[3]) / 100;
                this.setCapabilityValue("meter_power", currentEnergy);

                const currentPower = Number(parsedResult[23]);
                this.setCapabilityValue("measure_power", currentPower);

                const currentTemperature = Number(parsedResult[32]) / 10;
                this.setCapabilityValue(
                    "measure_temperature",
                    currentTemperature
                );

                this.log(`Current energy is ${currentEnergy}kWh`);
                this.log(`Current power is ${currentPower}W`);
                this.log(
                    `Current inverter temperature is ${currentTemperature} degrees Celsius`
                );
            })
            .catch((error) => {
                if (error.code === "EHOSTUNREACH") {
                    this.log("Inverter offline");
                    this.setCapabilityValue("measure_power", 0);
                    this.log(`Current power is 0W`);
                } else {
                    this.log(`Unavailable (${error})`);
                    this.setUnavailable(`Error retrieving data (${error})`);
                }
            });
    }
}

module.exports = ESolarWifiModule;
