import sourceMapSupport from "source-map-support";
sourceMapSupport.install();

import Homey from "homey";
const { Log } = require("homey-log");

class SolarPanels extends Homey.App {
  public homeyLog?: {};

  /**
   * onInit is called when the app is initialized.
   */
  async onInit(): Promise<void> {
    this.homeyLog = new Log({ homey: this.homey });

    this.homey.log("App has been initialized");
  }
}

module.exports = SolarPanels;
