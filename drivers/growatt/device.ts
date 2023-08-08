import { Inverter } from "../../inverter";
import GrowattApi from "./api";
import { DeviceData, DeviceSettings } from "./types";

class GrowattDevice extends Inverter {
  interval = 15;
  api?: GrowattApi;

  async onInit() {
    const settings: DeviceSettings = this.getSettings();

    const data: DeviceData = this.getData();

    // Migration: plantId should be part of device data since June 10, 2023
    if (!data.plantId) {
      this.setUnavailable("Please remove and re-add your Growatt device");
    }

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

    // Migration: plantId should be part of device data since June 10, 2023
    if (!data.plantId) {
      return;
    }

    if (this.api) {
      const productionData = await this.api.getInverterProductionData(data);

      if (productionData !== null) {
        const currentEnergy = productionData.energyToday;
        const currentPower = productionData.currentPower;

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
