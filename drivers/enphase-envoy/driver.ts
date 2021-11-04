import { DiscoveryResultMDNSSD, Driver } from "homey";
import { EnphaseMDNSTxtData } from "./types";

class EnphaseEnvoyDriver extends Driver {
  async onPairListDevices() {
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();

    const devices = Object.values(discoveryResults).map((discoveryResult) => {
      const typedDiscoveryResult = discoveryResult as DiscoveryResultMDNSSD;
      const txtData = typedDiscoveryResult.txt as EnphaseMDNSTxtData;

      return {
        name: txtData.name,
        data: {
          id: typedDiscoveryResult.id,
        },
      };
    });

    return devices;
  }
}

module.exports = EnphaseEnvoyDriver;
