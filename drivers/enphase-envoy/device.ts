import { DiscoveryResultMDNSSD } from "homey";
import { Inverter } from "../../inverter";

import EnphaseEnvoyApi from "./api";

class EnphaseEnvoy extends Inverter {
  interval = 1 / 10;
  enphaseApi?: EnphaseEnvoyApi;
  hasUpdatedPastSupport: boolean = false;

  async onInit() {
    // SDK v3 migration
    if (this.hasCapability("consumption")) {
      this.removeCapability("consumption");
      this.addCapability("measure_power.consumption");
    }
    if (this.hasCapability("daily_consumption")) {
      this.removeCapability("daily_consumption");
      this.addCapability("meter_power.consumption");
    }

    super.onInit();
  }

  onDiscoveryResult(discoveryResult: DiscoveryResultMDNSSD) {
    // Return a truthy value here if the discovery result matches your device.
    return discoveryResult.id === this.getData().id;
  }

  async onDiscoveryAvailable(discoveryResult: DiscoveryResultMDNSSD) {
    // This method will be executed once when the device has been found (onDiscoveryResult returned true)
    this.enphaseApi = new EnphaseEnvoyApi(
      `${discoveryResult.address}:${discoveryResult.port}`
    );

    await this.enphaseApi.getProductionData(); // When this throws, the device will become unavailable.
  }

  onDiscoveryAddressChanged(discoveryResult: DiscoveryResultMDNSSD) {
    // Update your connection details here, reconnect when the device is offline
    this.enphaseApi = new EnphaseEnvoyApi(
      `${discoveryResult.address}:${discoveryResult.port}`
    );
  }

  async onDiscoveryLastSeenChanged() {
    // When the device is offline, try to reconnect here
    await this.setAvailable();
  }

  async checkProduction() {
    this.homey.log("Checking production");

    if (this.enphaseApi && !this.hasUpdatedPastSupport) {
      try {
        // Check whether the device has upgraded to v7
        const softwareVersion = await this.enphaseApi.getEnvoySoftwareVersion();
        if (softwareVersion !== null && softwareVersion.startsWith("D7")) {
          // Enphase Envoy has updated to v7, user needs to migrate
          this.hasUpdatedPastSupport = true;

          this.homey.log(
            "Enphase Envoy has updated to firmware D7x - suggesting user to upgrade to new driver"
          );

          this.setUnavailable(
            "Your Enphase Envoy has received a software update that requires re-pairing the device to Homey. Please remove your Envoy device from Homey and re-add it."
          );

          return;
        }
      } catch (err) {
        this.homey.log("Failed checking for Envoy software version");
      }

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
          this.homey.log(
            `Current production energy is ${currentProductionEnergy}kWh`
          );
        }

        await this.setCapabilityValue("measure_power", currentProductionPower);
        this.homey.log(
          `Current production power is ${currentProductionPower}W`
        );

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

          this.homey.log(
            `Current consumption power is ${currentConsumptionPower}W`
          );
          this.homey.log(
            `Current consumption energy is ${currentConsumptionEnergy}W`
          );
        }

        await this.setAvailable();
      } catch (err) {
        const errorMessage = (err as Error).message;

        this.homey.log(`Unavailable: ${errorMessage}`);
        await this.setUnavailable(errorMessage);
      }
    } else if (!this.enphaseApi) {
      await this.setUnavailable(
        "Enphase Envoy could not be discovered on your network"
      );
    }
  }
}

module.exports = EnphaseEnvoy;
