import EnphaseOAuth2Client from "./lib/oauth2";
import { ApiSystems } from "./types";

const { OAuth2Driver, OAuth2Util } = require("homey-oauth2app");

class EnphaseEnlightenDriver extends OAuth2Driver {
  async onPairListDevices({
    oAuth2Client,
  }: {
    oAuth2Client: EnphaseOAuth2Client;
  }) {
    const systems: ApiSystems = await oAuth2Client.getSystems();

    return systems.systems.map((system) => {
      return {
        name: system.name,
        data: {
          id: system.system_id,
        },
      };
    });
  }
}

module.exports = EnphaseEnlightenDriver;
