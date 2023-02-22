"use strict";

import { Inverter } from "../../inverter";
import OmnikLocalApi from "./api";
import { DeviceData, DeviceSettings } from "./types";

class OmnikLocal extends Inverter {
  interval = 15;
  api?: OmnikLocalApi;

  async onInit() {

    const settings: DeviceSettings = this.getSettings();
    const data: DeviceData = this.getData();

    if (!this.hasCapability("measure_temperature")) {
      this.addCapability("measure_temperature");
    }

    this.api = new OmnikLocalApi({ address: settings.ip, wifiSn: data.id });

    await super.onInit();
  }

  async onSettings({ newSettings }: { newSettings: object }) {
    const typedNewSettings = newSettings as DeviceSettings;

    const data: DeviceData = this.getData();

    this.api = new OmnikLocalApi({ address: typedNewSettings.ip, wifiSn: data.id });
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
