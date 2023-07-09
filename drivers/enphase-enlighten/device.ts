import EnphaseOAuth2Client from "./lib/oauth2";

const { OAuth2Device } = require("homey-oauth2app");

class EnphaseEnlightenDevice extends OAuth2Device {
  /** The refresh interval in minutes */
  interval: number = 10;
  oAuth2Client?: EnphaseOAuth2Client;
  currentInterval?: NodeJS.Timeout;

  private setInterval(interval: number) {
    this.currentInterval = this.homey.setInterval(
      this.checkProduction.bind(this),
      interval * 60000
    );
  }

  resetInterval(newInterval: number) {
    this.homey.clearInterval(this.currentInterval);
    this.setInterval(newInterval);
  }

  async onInit(): Promise<void> {
    this.setInterval(this.interval);

    // Force immediate production check
    this.checkProduction();
  }

  async checkProduction() {
    this.log("Checking production");

    const productionData = await this.oAuth2Client?.getSystemSummary(
      this.getData().id
    );

    if (productionData) {
      const currentEnergy = productionData.energy_today / 1000;
      const currentPower = productionData.current_power;

      await this.setCapabilityValue("meter_power", currentEnergy);
      await this.setCapabilityValue("measure_power", currentPower);

      this.homey.log(`Current energy is ${currentEnergy}kWh`);
      this.homey.log(`Current power is ${currentPower}W`);
    }
  }
}

module.exports = EnphaseEnlightenDevice;
