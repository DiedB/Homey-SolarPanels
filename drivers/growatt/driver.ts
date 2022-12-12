import { Driver } from "homey";
import PairSession from "homey/lib/PairSession";

import GrowattApi from "./api";

class GrowattDriver extends Driver {
  async onPair(session: PairSession) {
    let username = "";
    let password = "";

    session.setHandler("login", async (data) => {
      username = data.username;
      password = data.password;

      const api = new GrowattApi(username, password);

      await api.login();

      return true;
    });

    session.setHandler("list_devices", async () => {
      const api = new GrowattApi(username, password);

      const serialNumbers = await api.getInverterSerialNumbers();

      const devices = serialNumbers.map((serialNumber) => ({
        name: serialNumber,
        data: { id: serialNumber },
        settings: { username, password },
      }));

      return devices;
    });
  }
}

module.exports = GrowattDriver;
