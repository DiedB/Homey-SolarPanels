import sourceMapSupport from "source-map-support";
sourceMapSupport.install();

import Homey from "homey";

class SolarPanels extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit(): Promise<void> {
    this.log("App has been initialized");
  }
}

module.exports = SolarPanels;
