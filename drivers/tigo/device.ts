import { Inverter } from "../../inverter";
import TigoApi from "./api";
import { DeviceData, DeviceSettings } from "./types";

class TigoDevice extends Inverter {
  interval = 5;
  api?: TigoApi;

  async onInit() {
    const data: DeviceData = this.getData();
    const settings: DeviceSettings = this.getSettings();

    this.api = new TigoApi(settings.username, settings.password, data.sid);

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

    if (changedKeys.includes("username") || changedKeys.includes("password")) {
      const data: DeviceData = this.getData();
      const newApi = new TigoApi(
        typedNewSettings.username,
        typedNewSettings.password,
        data.sid
      );

      await newApi.getSummary();

      this.api = newApi;

      // Force production check when API key is changed
      this.checkProduction();
    }
  }

  async checkProduction(): Promise<void> {
    this.homey.log("Checking production");

    if (this.api) {
      try {
        const systemSummary = await this.api.getSummary();

        const currentEnergy =
          Number(systemSummary.summary.daily_energy_dc) / 1000;
        this.setCapabilityValue("meter_power", currentEnergy);

        const currentPower = Number(systemSummary.summary.last_power_dc);
        this.setCapabilityValue("measure_power", currentPower);

        this.homey.log(`Current energy is ${currentEnergy}kWh`);
        this.homey.log(`Current power is ${currentPower}W`);

        await this.setAvailable();
      } catch (err) {
        const errorMessage = (err as Error).message;

        this.homey.log(`Unavailable: ${errorMessage}`);
        await this.setUnavailable(errorMessage);
      }
    } else {
      await this.setUnavailable("Tigo API connection not initialized");
    }
  }
}

module.exports = TigoDevice;
