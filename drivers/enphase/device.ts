import { Inverter } from "../../inverter";
import EnphaseEnlightenApi from "./api";
import { EnphaseApiSystems, DeviceData, DeviceSettings } from "./types";

class EnphaseDevice extends Inverter {
  interval = this.getSetting("interval");
  api?: EnphaseEnlightenApi;

  async onInit() {
    const data: DeviceData = this.getData();
    const settings: DeviceSettings = this.getSettings();

    this.api = new EnphaseEnlightenApi(settings.uid, settings.key, data.id);

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

    if (changedKeys.includes("key") || changedKeys.includes("uid")) {
      const data: DeviceData = this.getData();
      const newApi = new EnphaseEnlightenApi(
        typedNewSettings.uid,
        typedNewSettings.key,
        data.id
      );

      await newApi.getStats();

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
        const systemStats = await this.api.getStats();

        let currentEnergy = 0;
        let currentPower = 0;

        if (systemStats !== null) {
          currentEnergy =
            systemStats.intervals.reduce(
              (lastValue, report) => lastValue + report.enwh,
              0
            ) / 1000;
          currentPower =
            systemStats.intervals[systemStats.intervals.length - 1].powr;
        }

        this.setCapabilityValue("meter_power", currentEnergy);
        this.setCapabilityValue("measure_power", currentPower);

        this.homey.log(`Current energy is ${currentEnergy}kWh`);
        this.homey.log(`Current power is ${currentPower}W`);

        this.setAvailable();
      } catch (err) {
        const errorMessage = (err as Error).message;

        this.homey.log(`Unavailable: ${errorMessage}`);
        this.setUnavailable(errorMessage);
      }
    } else {
      this.setUnavailable("Enphase Enlighten API connection not initialized");
    }
  }
}

module.exports = EnphaseDevice;
