import { Inverter } from "../../inverter";
import SolarEdgeApi from "./api";
import { PowerResponse, DeviceData, DeviceSettings } from "./types";

class SolarEdgeDevice extends Inverter {
  interval = this.getSetting("interval");
  api?: SolarEdgeApi;

  async onInit() {
    const data: DeviceData = this.getData();
    const settings: DeviceSettings = this.getSettings();

    // SDK v3 migration
    if (this.hasCapability("consumption")) {
      this.removeCapability("consumption");
    }
    if (this.hasCapability("daily_consumption")) {
      this.removeCapability("daily_consumption");
    }

    this.api = new SolarEdgeApi(
      settings.key,
      data.sid,
      data.serial_number,
      this.homey.clock.getTimezone()
    );

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
        typedNewSettings.key,
        data.sid,
        data.serial_number,
        this.homey.clock.getTimezone()
      );

      await newApi.checkSettings();

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
        // Power values
        const powerResponse: PowerResponse = await this.api.getPowerData();

        powerResponse.powerDetails.meters.forEach((meter) => {
          const currentMeterType = meter.type.toLowerCase();

          const lastMeasurement = meter.values
            .filter((m) => m.value !== undefined)
            .pop();

          if (lastMeasurement) {
            const currentValue = lastMeasurement.value as number;

            const capabilityId =
              currentMeterType === "production"
                ? "measure_power"
                : "measure_power.consumption";

            // Check if consumption is supported, add capability if needed
            if (
              capabilityId === "measure_power.consumption" &&
              !this.hasCapability(capabilityId)
            ) {
              this.addCapability(capabilityId);
            }

            this.setCapabilityValue(capabilityId, currentValue);

            this.homey.log(
              `Current ${currentMeterType} power is ${currentValue}W`
            );
          } else {
            this.homey.log(`No new power data for ${currentMeterType}`);
          }
        });

        // Sleep to prevent hitting rate limits
        await new Promise((r) => setTimeout(r, 30000));

        // Energy values
        const energyResponse = await this.api.getEnergyData();

        energyResponse.energyDetails.meters.forEach((meter) => {
          const currentMeterType = meter.type.toLowerCase();

          const lastMeasurement = meter.values
            .filter((m) => m.value !== undefined)
            .pop();

          if (lastMeasurement) {
            const currentValue = (lastMeasurement.value as number) / 1000;

            const capabilityId =
              currentMeterType === "production"
                ? "meter_power"
                : "meter_power.consumption";

            // Check if consumption is supported, add capability if needed
            if (
              capabilityId === "meter_power.consumption" &&
              !this.hasCapability(capabilityId)
            ) {
              this.addCapability(capabilityId);
            }

            this.setCapabilityValue(capabilityId, currentValue);

            this.homey.log(
              `Current ${currentMeterType} energy is ${currentValue}kWh`
            );
          } else {
            this.homey.log(`No new energy data for ${currentMeterType}`);
          }
        });

        // Sleep to prevent hitting rate limits
        await new Promise((r) => setTimeout(r, 30000));

        // Equipment values (inverter temperature and total energy)
        // Only fetch equipment if inverter serial number is known
        const equipmentDataResponse = await this.api.getEquipmentData();

        if (equipmentDataResponse.data.count > 0) {
          const latestTelemetry =
            equipmentDataResponse.data.telemetries[
              equipmentDataResponse.data.telemetries.length - 1
            ];

          if (latestTelemetry.temperature) {
            this.setCapabilityValue(
              "measure_temperature",
              latestTelemetry.temperature
            );

            this.homey.log(
              `Current inverter temperature is ${latestTelemetry.temperature} degrees Celsius`
            );
          }

          if (latestTelemetry.totalEnergy) {
            this.setCapabilityValue(
              "meter_power.total",
              latestTelemetry.totalEnergy / 1000
            );

            this.homey.log(
              `Current total energy yield is ${
                latestTelemetry.totalEnergy / 1000
              } kWh`
            );
          }
        } else {
          this.homey.log("No new telemetry data");
        }

        this.setAvailable();
      } catch (err) {
        const errorMessage = (err as Error).message;

        this.homey.log(`Unavailable: ${errorMessage}`);
        this.setUnavailable(errorMessage);
      }
    } else {
      this.setUnavailable("SolarEdge API connection not initialized");
    }
  }
}

module.exports = SolarEdgeDevice;
