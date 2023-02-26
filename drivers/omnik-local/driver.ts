"use strict";
import { Driver } from "homey";
import { OmnikLocalApi, TimeoutError, UnexpectedResponseError } from "./api";
import { Device } from "./types";

class OmnikLocal extends Driver {
  async onPair(session: any) {
    let pairingDevice: Device;
    let pairingIpAddress: string | null = null;
    let pairingWifiSn: number | null = null;

    session.setHandler("showView", async (view: string) => {
      this.log("Show view", view);

      if (view === "validate") {
        if (pairingIpAddress === null) {
          await session.showView("pair");
          await session.emit("alert", this.homey.__("pair.omnik-local.error.missing_ip_address"));
          return;
        }

        if (pairingWifiSn === null) {
          await session.showView("pair");
          await session.emit("alert", this.homey.__("pair.omnik-local.error.missing_wifi_sn"));
          return;
        }

        try {
          let omnikLocalApi = new OmnikLocalApi({ address: pairingIpAddress, wifiSn: pairingWifiSn });

          const { inverterName } = await omnikLocalApi.getData();

          pairingDevice = {
            name: inverterName,
            data: {
              id: Number(pairingWifiSn)
            },
            settings: {
              ip: pairingIpAddress,
              interval: 5
            }
          };

          await session.showView("add_device");
        } catch (error) {
          if (error instanceof TimeoutError) {
            await session.showView("pair");
            await session.emit("alert", this.homey.__("pair.omnik-local.error.connection_timed_out"));
          } else if (error instanceof UnexpectedResponseError) {
            await session.showView("pair");
            await session.emit("alert", this.homey.__("pair.omnik-local.error.unexpected_response"));
          } else {
            await session.showView("pair");
            await session.emit("alert", this.homey.__("error.generic"));
          }
        }
      }
    });

    session.setHandler("validate", async ({ address, wifiSn }: { address: string, wifiSn: number }) => {
      session.showView("validate");

    });

    session.setHandler("getDevice", async () => {
      return pairingDevice;
    });

    session.setHandler("error", async (error: any) => {
      this.log("session.setHandler(error)", error);
    });

    session.setHandler("add_device_error", async (error: string) => {
      await session.showView("pair");
      await session.emit("alert", error);
    });

    session.setHandler("getIpAddress", async () => {
      return pairingIpAddress;
    });

    session.setHandler("setIpAddress", async (ip: string) => {
      pairingIpAddress = ip;
    });

    session.setHandler("getWifiSn", async () => {
      return pairingWifiSn;
    });

    session.setHandler("setWifiSn", async (wifiSn: number) => {
      pairingWifiSn = wifiSn;
    });

  }
}

module.exports = OmnikLocal;
