import { Inverter } from "../../inverter";
import GrowattApi from "./api";
import { DeviceData, DeviceSettings } from "./types";

class GrowattDevice extends Inverter {
  interval = 60;
  api?: GrowattApi;

  async onInit() {
    const settings: DeviceSettings = this.getSettings();

    this.api = new GrowattApi(settings.username, settings.password);
    await this.api.login();

    super.onInit();
  }

  async onSettings({ newSettings }: { newSettings: object }) {
    // TODO: fix typing once Athom fixes their TypeScript implementation
    const typedNewSettings = newSettings as DeviceSettings;

    const api = new GrowattApi(
      typedNewSettings.username,
      typedNewSettings.password
    );
    await api.login();

    this.api = api;
  }

  async checkProduction(): Promise<void> {
    this.homey.log("Checking production");

    const data: DeviceData = this.getData();

    if (this.api) {
      const production = await this.api.getInverterProductionData(data.id);

      if (production !== null) {
        const currentEnergy = production.energyToday;
        const currentPower = production.currentPower;

        this.setCapabilityValue("meter_power", currentEnergy);

        this.setCapabilityValue("measure_power", currentPower);

        this.homey.log(`Current energy is ${currentEnergy}kWh`);
        this.homey.log(`Current power is ${currentPower}W`);

        await this.setAvailable();
      } else {
        await this.setUnavailable("Could not retrieve Growatt production data");
      }
    } else {
      await this.setUnavailable("Growatt API connection not initialized");
    }
  }
}

module.exports = GrowattDevice;
