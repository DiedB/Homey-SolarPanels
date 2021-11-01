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
  }

  async checkProduction(): Promise<void> {
    this.homey.log("Checking production");

    if (this.api) {
      try {
        // Production values
        const statusData: StatusData = await this.api.getStatusData();

        await this.setCapabilityValue("measure_power", statusData.currentPower);
        await this.setCapabilityValue("meter_power", statusData.dailyYield);

        this.homey.log(`Current power is ${statusData.currentPower}W`);
        this.homey.log(`Current energy is ${statusData.dailyYield}kWh`);

        // Temperature and voltage values
        if (statusData.currentVoltage) {
          if (!this.hasCapability("measure_voltage")) {
            await this.addCapability("measure_voltage");
          }

          await this.setCapabilityValue(
            "measure_voltage",
            statusData.currentVoltage
          );
        }

        if (statusData.currentTemperature) {
          if (!this.hasCapability("measure_temperature")) {
            await this.addCapability("measure_temperature");
          }

          await this.setCapabilityValue(
            "measure_temperature",
            statusData.currentTemperature
          );
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
