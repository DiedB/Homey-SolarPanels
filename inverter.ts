import { Device } from "homey";

export class Inverter extends Device {
  /** The refresh interval in minutes */
  interval?: number;
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
    if (!this.interval) {
      throw new Error("Expected interval to be set");
    }

    this.setInterval(this.interval);

    // SDK v3 migration, remove cron listeners
    this.removeAllListeners();

    // Force immediate production check
    this.checkProduction();
  }

  checkProduction() {
    throw new Error("Expected override");
  }

  onDeleted () {
    this.homey.clearInterval(this.currentInterval);
  }
}
