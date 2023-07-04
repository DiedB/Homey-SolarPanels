import { DiscoveryResultMDNSSD } from "homey";
import { Inverter } from "../../inverter";

import EnphaseEnvoyApi from "./api";
import { DeviceData, DeviceSettings } from "./types";

class EnphaseEnvoy extends Inverter {
  interval = 1;
  enphaseApi?: EnphaseEnvoyApi;

  onDiscoveryResult(discoveryResult: DiscoveryResultMDNSSD) {
    // Return a truthy value here if the discovery result matches your device.
    return discoveryResult.id === this.getData().id;
  }

  async onDiscoveryAvailable(discoveryResult: DiscoveryResultMDNSSD) {
    // This method will be executed once when the device has been found (onDiscoveryResult returned true)
    const { username, password } = this.getSettings() as DeviceSettings;

    this.enphaseApi = new EnphaseEnvoyApi(
      `${discoveryResult.address}`,
      this.getData().id,
      username,
      password
    );

    await this.enphaseApi.getProductionData(); // When this throws, the device will become unavailable.
  }

  onDiscoveryAddressChanged(discoveryResult: DiscoveryResultMDNSSD) {
    // Update your connection details here, reconnect when the device is offline
    const { username, password } = this.getSettings() as DeviceSettings;

    this.enphaseApi = new EnphaseEnvoyApi(
      `${discoveryResult.address}`,
      this.getData().id,
      username,
      password
    );
  }

  async onDiscoveryLastSeenChanged() {
    // When the device is offline, try to reconnect here
    await this.setAvailable();
  }

  async onSettings({ newSettings }: { newSettings: object }) {
    // TODO: fix typing once Athom fixes their TypeScript implementation
    const typedNewSettings = newSettings as DeviceSettings;

    await EnphaseEnvoyApi.getEnphaseSessionId(
      typedNewSettings.username,
      typedNewSettings.password
    );

    this.enphaseApi?.setCredentials(
      typedNewSettings.username,
      typedNewSettings.password
    );

    await this.setAvailable();
  }

  async checkProduction() {
    this.log("Checking production");

    if (this.enphaseApi) {
      try {
        const productionData = await this.enphaseApi.getProductionData();

        const currentPower = productionData.wattsNow;
        const currentEnergy = productionData.wattHoursToday / 1000;

        await this.setCapabilityValue("measure_power", currentPower);
        this.log(`Current production power is ${currentPower}W`);

        await this.setCapabilityValue("meter_power", currentEnergy);
        this.log(`Current production energy is ${currentEnergy}kWh`);

        await this.setAvailable();
      } catch (err) {
        const errorMessage = (err as Error).message;

        this.homey.log(`Unavailable: ${errorMessage}`);
        await this.setUnavailable(errorMessage);
      }
    } else {
      await this.setUnavailable(
        "Enphase Envoy could not be discovered on your network"
      );
    }
  }
}

module.exports = EnphaseEnvoy;
