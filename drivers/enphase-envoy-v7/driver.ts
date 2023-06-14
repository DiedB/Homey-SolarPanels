import { DiscoveryResultMDNSSD, Driver } from "homey";
import PairSession from "homey/lib/PairSession";

import EnphaseEnvoyApi from "./api";

class EnphaseEnvoyDriver extends Driver {
  async onPair(session: PairSession) {
    let username: string | null = null;
    let password: string | null = null;

    session.setHandler("login", async (data) => {
      await EnphaseEnvoyApi.getEnphaseSessionId(data.username, data.password);

      username = data.username;
      password = data.password;

      return true;
    });

    session.setHandler("list_devices", async () => {
      const discoveryStrategy = this.getDiscoveryStrategy();
      const discoveryResults = discoveryStrategy.getDiscoveryResults();

      this.log("[DEBUG] Listing devices");
      this.log(discoveryResults);

      const devices = Object.values(discoveryResults).map((discoveryResult) => {
        const typedDiscoveryResult = discoveryResult as DiscoveryResultMDNSSD;

        return {
          name: `${typedDiscoveryResult.name} (${typedDiscoveryResult.id})`,
          data: {
            id: typedDiscoveryResult.id,
          },
          settings: { username, password },
        };
      });

      return devices;
    });
  }
}

module.exports = EnphaseEnvoyDriver;
