"use strict";

import { Inverter } from "../../inverter";
import OmnikLocalApi from "./api";
import { DeviceData, DeviceSettings, SettingsInput } from "./types";

class OmnikLocal extends Inverter {
  interval = this.getSetting("interval");
  api?: OmnikLocalApi;

  async onInit(): Promise<void> {
    this.log("Device has been initialized");

    const settings: DeviceSettings = this.getSettings();
    const data: DeviceData = this.getData();

    if (!this.hasCapability("measure_temperature")) {
      this.addCapability("measure_temperature");
    }

    this.api = new OmnikLocalApi({ address: settings.ip, wifiSn: data.id });

    return super.onInit();
  }

  async onSettings({ newSettings, changedKeys }: SettingsInput) {
    const data: DeviceData = this.getData();

    if (changedKeys.includes("ip") && newSettings.ip) {
      this.api = new OmnikLocalApi({ address: newSettings.ip, wifiSn: data.id });
    }

    if (changedKeys.includes("interval") && newSettings.interval) {
      this.resetInterval(newSettings.interval);
      this.homey.log(`Changed interval to ${newSettings.interval}`);
    }
  }

  async checkProduction() {
    this.log("Checking production");

    try {
      if (typeof this.api === "undefined") {
        throw new Error("API not initialized");
      }

      const {
        inverterName: _,
        currentPower,
        currentVoltage,
        dailyProduction,
        currentTemperature
      } = await this.api.getData();

      await this.setCapabilityValue("meter_power", dailyProduction);
      await this.setCapabilityValue("measure_voltage", currentVoltage);
      await this.setCapabilityValue("measure_power", currentPower);
      await this.setCapabilityValue("measure_temperature", currentTemperature);

      if (!this.getAvailable()) {
        await this.setAvailable();
      }
    } catch (error) {
      this.error(`Unavailable (${error})`);
      await this.setUnavailable(`Error retrieving data (${error})`);
    }
  }
}

module.exports = OmnikLocal;
