import { Device } from "homey";
import { Inverter } from "../../inverter";
import PvOutputApi from "./api";
import { DeviceData, DeviceSettings, StatusData } from "./types";

class PvOutputDevice extends Inverter {
  interval = this.getSetting("interval");
  api?: PvOutputApi;

  async onInit() {
    const data: DeviceData = this.getData();
    const settings: DeviceSettings = this.getSettings();

    this.api = new PvOutputApi(data.sid, settings.key);

    super.onInit();
  }

  async onSettings({
    newSettings,
    changedKeys,
  }: {
    newSettings: object;
    changedKeys: string[];
  }) {
    // TODO: fix typing once Athom fixes their TypeScript implementation
    const typedNewSettings = newSettings as DeviceSettings;

    if (changedKeys.includes("key")) {
      const data: DeviceData = this.getData();
      const newApi = new PvOutputApi(data.sid, typedNewSettings.key);

      await newApi.getSystemName();

      this.api = newApi;

      // Force production check when API key is changed
      this.checkProduction();
    }

    if (changedKeys.includes("interval") && typedNewSettings.interval) {
      this.resetInterval(typedNewSettings.interval);
      this.homey.log(`Changed interval to ${typedNewSettings.interval}`);
    }

    if (changedKeys.includes("useExtendedFields")) {
      if (!typedNewSettings.useExtendedFields) {
        // Remove extended capabilities
        this.removeCapability("battery_soc");
      }
    }
  }

  async checkProduction(): Promise<void> {
    this.homey.log("Checking production");

    const settings: DeviceSettings = this.getSettings();

    if (this.api) {
      try {
        // Production values
        const statusData: StatusData = await this.api.getStatusData(
          settings.useExtendedFields
        );

        // Production power
        if (!isNaN(statusData.currentProductionPower as number)) {
          await this.setCapabilityValue(
            "measure_power",
            statusData.currentProductionPower
          );

          this.homey.log(
            `Current production power is ${statusData.currentProductionPower}W`
          );
        }

        // Daily production energy
        if (!isNaN(statusData.dailyProductionEnergy as number)) {
          await this.setCapabilityValue(
            "meter_power",
            statusData.dailyProductionEnergy
          );

          this.homey.log(
            `Current production energy is ${statusData.dailyProductionEnergy}kWh`
          );
        }

        // Consumption power
        if (!isNaN(statusData.currentConsumptionPower as number)) {
          if (!this.hasCapability("measure_power.consumption")) {
            this.addCapability("measure_power.consumption");
          }

          await this.setCapabilityValue(
            "measure_power.consumption",
            statusData.currentConsumptionPower
          );

          this.homey.log(
            `Current consumption power is ${statusData.currentConsumptionPower}W`
          );
        }

        // Daily consumption energy
        if (!isNaN(statusData.dailyConsumptionEnergy as number)) {
          if (!this.hasCapability("meter_power.consumption")) {
            this.addCapability("meter_power.consumption");
          }

          await this.setCapabilityValue(
            "meter_power.consumption",
            statusData.dailyConsumptionEnergy
          );

          this.homey.log(
            `Current consumption energy is ${statusData.dailyConsumptionEnergy}kWh`
          );
        }

        // Temperature and voltage values
        if (!isNaN(statusData.currentVoltage as number)) {
          if (!this.hasCapability("measure_voltage")) {
            await this.addCapability("measure_voltage");
          }

          await this.setCapabilityValue(
            "measure_voltage",
            statusData.currentVoltage
          );

          this.homey.log(`Current voltage is ${statusData.currentVoltage}V`);
        }

        if (!isNaN(statusData.currentTemperature as number)) {
          if (!this.hasCapability("measure_temperature")) {
            await this.addCapability("measure_temperature");
          }

          await this.setCapabilityValue(
            "measure_temperature",
            statusData.currentTemperature
          );

          this.homey.log(
            `Current temperature is ${statusData.currentTemperature} degrees Celsius`
          );
        }

        // Handle extended fields
        if (settings.useExtendedFields) {
          // Battery percentage
          if (
            settings.batteryPercentageField &&
            settings.batteryPercentageField !== "-1" &&
            statusData.extendedFields
          ) {
            if (!this.hasCapability("battery_soc")) {
              await this.addCapability("battery_soc");
            }

            const batteryPercentage = parseFloat(
              statusData.extendedFields[
                parseInt(settings.batteryPercentageField) - 7
              ]
            );

            await this.setCapabilityValue("battery_soc", batteryPercentage);

            this.homey.log(
              `Current battery percentage is ${batteryPercentage}%`
            );
          }
        }

        this.setAvailable();
      } catch (err) {
        const errorMessage = (err as Error).message;

        this.homey.log(`Unavailable: ${errorMessage}`);
        this.setUnavailable(errorMessage);
      }
    } else {
      this.setUnavailable("PVOutput API connection not initialized");
    }
  }
}

module.exports = PvOutputDevice;
