import { Inverter } from "../../inverter";
import SolarEdgeApi from "./api";
import { PowerResponse, DeviceData, DeviceSettings } from "./types";

class SolarEdgeDevice extends Inverter {
  interval = this.getSetting("interval");
  api?: SolarEdgeApi;

  async onInit() {
    const data: DeviceData = this.getData();
    const settings: DeviceSettings = this.getSettings();

    this.api = new SolarEdgeApi(data.sid, settings.key, data.serial_number);

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
      const newApi = new SolarEdgeApi(
        data.sid,
        typedNewSettings.key,
        data.serial_number
      );

      await newApi.checkSettings();

      this.api = newApi;

      // Force production check when API key is changed
      this.checkProduction();
    }

    if (changedKeys.includes("interval")) {
      this.resetInterval(typedNewSettings.interval);
      this.log(`Changed interval to ${typedNewSettings.interval}`);
    }

    if (changedKeys.includes("checkTemperature")) {
      if (!typedNewSettings.checkTemperature) {
        this.removeCapability("measure_temperature");
      } else {
        this.addCapability("measure_temperature");
      }
    }
  }

  async checkProduction(): Promise<void> {
    this.log("Checking production");

    const data: DeviceData = this.getData();
    const settings: DeviceSettings = this.getSettings();

    if (this.api) {
      try {
        const powerResponse: PowerResponse = await this.api.getPowerData();

        powerResponse.powerDetails.meters.forEach((meter) => {
          const currentMeterType = meter.type.toLowerCase();

          if (meter.values.length > 0 && meter.values[0].value !== undefined) {
            const currentValue = Math.round(meter.values[0].value);

            const capabilityId =
              currentMeterType === "production"
                ? "measure_power"
                : "consumption";

            // Check if consumption is supported, add capability if needed
            if (
              capabilityId === "consumption" &&
              !this.hasCapability(capabilityId)
            ) {
              this.addCapability(capabilityId);
            }

            this.setCapabilityValue(capabilityId, currentValue);

            this.log(`Current ${currentMeterType} power is ${currentValue}W`);
          } else {
            this.log(`No new data for ${currentMeterType}`);
          }
        });

        // Energy values
        const energyResponse = await this.api.getEnergyData();

        energyResponse.energyDetails.meters.forEach((meter) => {
          const currentMeterType = meter.type.toLowerCase();

          if (meter.values.length > 0 && meter.values[0].value !== undefined) {
            const currentValue = Math.round(meter.values[0].value) / 1000;

            const capabilityId =
              currentMeterType === "production"
                ? "meter_power"
                : "daily_consumption";

            // Check if consumption is supported, add capability if needed
            if (
              capabilityId === "daily_consumption" &&
              !this.hasCapability(capabilityId)
            ) {
              this.addCapability(capabilityId);
            }

            this.setCapabilityValue(capabilityId, currentValue);

            this.log(
              `Current ${currentMeterType} energy is ${currentValue}kWh`
            );
          } else {
            this.log(`No new data for ${currentMeterType}`);
          }
        });

        // Equipment values (inverter temperature)
        // Only fetch equipment if inverter serial number is known
        if (settings.checkTemperature && data.serial_number) {
          const equipmentDataResponse = await this.api.getEquipmentData();

          const telemetries = equipmentDataResponse.data.telemetries;

          telemetries.reverse().some((telemetry) => {
            if (telemetry && telemetry.temperature !== undefined) {
              this.setCapabilityValue(
                "measure_temperature",
                telemetry.temperature
              );

              this.log(
                `Current inverter temperature is ${telemetry.temperature} degrees Celsius`
              );
            }

            return telemetry.temperature !== undefined;
          });
        }

        this.setAvailable();
      } catch (err) {
        const errorMessage = (err as Error).message;

        this.log(`Unavailable: ${errorMessage}`);
        this.setUnavailable(errorMessage);
      }
    } else {
      this.setUnavailable("SolarEdge API connection not initialized");
    }
  }
}

module.exports = SolarEdgeDevice;
