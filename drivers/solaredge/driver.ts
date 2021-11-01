import { Driver } from "homey";
import PairSession from "homey/lib/PairSession";

import SolarEdgeApi from "./api";
import { PairData, Device } from "./types";

class SolarEdgeDriver extends Driver {
  apiKey?: string;

  async onPair(session: PairSession) {
    session.setHandler("validate", async (data: PairData) => {
      this.log("Pair data received");

      const { apiKey } = data;
      this.apiKey = apiKey;

      return new SolarEdgeApi(apiKey).getSites();
    });

    session.setHandler("list_devices", async () => {
      this.log("Listing devices");

      const devicesList: Device[] = [];

      if (this.apiKey) {
        const sitesList = await new SolarEdgeApi(this.apiKey).getSites();

        for (const site of sitesList.sites.site) {
          const equipmentList = await new SolarEdgeApi(
            this.apiKey,
            site.id
          ).getEquipmentList();

          for (const reporter of equipmentList.reporters.list) {
            devicesList.push({
              name: `${reporter.name} (${reporter.manufacturer} ${reporter.model})`,
              data: {
                sid: site.id,
                serial_number: reporter.serialNumber,
              },
              settings: { key: this.apiKey },
            });
          }
        }
      }

      return devicesList;
    });
  }
}

module.exports = SolarEdgeDriver;
