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

        const isMetered =
          productionData.production[1] &&
          productionData.production[1].activeCount > 0;
        const hasConsumption =
          productionData.consumption &&
          productionData.consumption[0].activeCount > 0;

        let currentProductionEnergy;
        let currentProductionPower;
        if (isMetered) {
          currentProductionEnergy = productionData.production[1].whToday
            ? productionData.production[1].whToday / 1000
            : 0;
          currentProductionPower = productionData.production[1].wNow;
        } else {
          const enphaseEnergyMeterDate = this.getStoreValue(
            "enphaseEnergyMeterDate"
          );

          if (
            enphaseEnergyMeterDate &&
            enphaseEnergyMeterDate === new Date().toDateString()
          ) {
            currentProductionEnergy =
              (productionData.production[0].whLifetime -
                this.getStoreValue("enphaseEnergyMeter")) /
              1000;
          } else {
            this.setStoreValue(
              "enphaseEnergyMeterDate",
              new Date().toDateString()
            );
            this.setStoreValue(
              "enphaseEnergyMeter",
              productionData.production[0].whLifetime
            );

            currentProductionEnergy = 0;
          }

          currentProductionPower = productionData.production[0].wNow;
        }

        if (currentProductionEnergy !== null) {
          await this.setCapabilityValue("meter_power", currentProductionEnergy);
          this.log(
            `Current production energy is ${currentProductionEnergy}kWh`
          );
        }

        await this.setCapabilityValue("measure_power", currentProductionPower);
        this.log(`Current production power is ${currentProductionPower}W`);

        if (hasConsumption) {
          const currentConsumptionPower = productionData.consumption[0].wNow;
          const currentConsumptionEnergy =
            productionData.consumption[0].whToday / 1000;

          await this.setCapabilityValue(
            "measure_power.consumption",
            currentConsumptionPower
          );
          await this.setCapabilityValue(
            "meter_power.consumption",
            currentConsumptionEnergy
          );

          this.log(`Current consumption power is ${currentConsumptionPower}W`);
          this.log(
            `Current consumption energy is ${currentConsumptionEnergy}W`
          );
        }

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
