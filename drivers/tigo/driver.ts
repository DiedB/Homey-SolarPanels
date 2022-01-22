import { Driver } from "homey";
import PairSession from "homey/lib/PairSession";

import TigoApi from "./api";

class TigoDriver extends Driver {
  async onPair(session: PairSession) {
    let username = "";
    let password = "";

    session.setHandler("login", async (data) => {
      username = data.username;
      password = data.password;

      await new TigoApi(username, password).getSystems();

      return true;
    });

    session.setHandler("list_devices", async () => {
      const systemsResponse = await new TigoApi(
        username,
        password
      ).getSystems();

      const devices = systemsResponse.systems.map((system) => {
        return {
          name: system.name,
          data: {
            sid: system.system_id,
          },
          settings: {
            username,
            password,
          },
        };
      });

      return devices;
    });
  }
}

module.exports = TigoDriver;
