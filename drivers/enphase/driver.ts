import { Driver } from "homey";
import PairSession from "homey/lib/PairSession";

import EnphaseEnlightenApi from "./api";
import { PairData, Device } from "./types";

class EnphaseDriver extends Driver {
  userId?: string;
  apiKey?: string;

  async onPair(session: PairSession) {
    session.setHandler("validate", async (data: PairData) => {
      this.homey.log("Pair data received");

      const { userId, apiKey } = data;
      this.userId = userId;
      this.apiKey = apiKey;

      return new EnphaseEnlightenApi(userId, apiKey).getSystems();
    });

    session.setHandler("list_devices", async () => {
      this.homey.log("Listing devices");

      if (this.userId && this.apiKey) {
        const systemList = await new EnphaseEnlightenApi(
          this.userId,
          this.apiKey
        ).getSystems();

        return systemList.systems.map((system) => ({
          name: system.system_name,
          data: {
            id: system.system_id,
          },
          settings: { uid: this.userId, key: this.apiKey },
        }));
      }

      return [];
    });
  }
}

module.exports = EnphaseDriver;
