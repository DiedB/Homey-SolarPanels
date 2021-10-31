import { Device } from "homey";

export class Inverter extends Device {
  interval?: number;
  currentInterval?: NodeJS.Timeout;

  resetInterval(newInterval: number) {
    this.homey.clearInterval(this.currentInterval);

    this.homey.setInterval(this.checkProduction, newInterval * 60000);
  }

  async onInit(): Promise<void> {
    if (!this.interval) {
      throw new Error("Expected interval to be set");
    }

    this.currentInterval = this.homey.setInterval(
      this.checkProduction,
      this.interval * 60000
    );

    // Force immediate production check
    this.checkProduction();
  }

  checkProduction() {
    throw new Error("Expected override");
  }
}
