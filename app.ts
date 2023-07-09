const EnphaseOAuth2Client = require("./drivers/enphase-enlighten/lib/oauth2");
const { OAuth2App } = require("homey-oauth2app");

class SolarPanels extends OAuth2App {
  static OAUTH2_CLIENT = EnphaseOAuth2Client;
  static OAUTH2_DEBUG = true;
  static OAUTH2_DRIVERS = ["enphase-enlighten"];

  /**
   * onInit is called when the app is initialized.
   */
  async onInit(): Promise<void> {
    this.homey.log("App has been initialized");

    super.onInit();
  }
}

module.exports = SolarPanels;
