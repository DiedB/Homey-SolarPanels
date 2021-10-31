import { Driver } from "homey";
import PairSession from "homey/lib/PairSession";

import SolarEdgeApi from "./api";
import { PairData, EquipmentListResponse } from "./types";

class SolarEdgeDriver extends Driver {
  systemId?: string;
  apiKey?: string;
  equipmentList?: EquipmentListResponse;

  async onPair(session: PairSession) {
    session.setHandler("validate", async (data: PairData) => {
      this.log("Pair data received");

      const { apiKey, systemId } = data;

      this.apiKey = apiKey;
      this.systemId = systemId;

      const api = new SolarEdgeApi(systemId, apiKey);
      return api.getEquipmentList();
    });

    session.setHandler("list_devices", async () => {
      this.log(
        `Found ${this.equipmentList?.reporters.list.length} devices, listing`
      );

      const devices =
        this.equipmentList?.reporters.list.map((item) => ({
          name: item.name,
          data: {
            sid: this.systemId,
            serial_number: item.serialNumber,
          },
          settings: { key: this.apiKey },
        })) || [];

      return devices;
    });
  }
}

module.exports = SolarEdgeDriver;
