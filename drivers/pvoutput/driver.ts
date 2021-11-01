import { Driver } from "homey";
import PairSession from "homey/lib/PairSession";

import PvOutputApi from "./api";
import { PairData, Device } from "./types";

class PvOutputDriver extends Driver {
  apiKey?: string;
  systemId?: string;

  async onPair(session: PairSession) {
    session.setHandler("validate", async (data: PairData) => {
      this.homey.log("Pair data received");

      const { apiKey, systemId } = data;
      this.apiKey = apiKey;
      this.systemId = systemId;

      return new PvOutputApi(this.systemId, this.apiKey).getSystemName();
    });

    session.setHandler("list_devices", async () => {
      this.homey.log("Listing devices");

      const devicesList: Device[] = [];

      if (this.apiKey && this.systemId) {
        const systemName = await new PvOutputApi(
          this.systemId,
          this.apiKey
        ).getSystemName();

        devicesList.push({
          name: systemName,
          data: {
            sid: this.systemId,
          },
          settings: {
            key: this.apiKey,
          },
        });
      }

      return devicesList;
    });
  }
}

module.exports = PvOutputDriver;
