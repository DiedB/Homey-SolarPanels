// Copyright 2019: Rob, https://github.com/pro-sumer
// License: GNU GPLv3, https://www.gnu.org/licenses/gpl.txt

const fetch = require("node-fetch");
import crypto from "crypto";

import {
  DeviceData,
  DeviceList,
  LoginData,
  PlantData,
  PlantParams,
} from "./types";

export default class GrowattApi {
  private username: string;
  private password: string;

  private plants: PlantParams[] = [];
  private cookies: string | null = null;

  private baseUrl = "https://server-api.growatt.com";
  private loginUrl = `${this.baseUrl}/newTwoLoginAPI.do`;
  private plantUrl = `${this.baseUrl}/newTwoPlantAPI.do`;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = crypto
      .createHash("md5")
      .update(password)
      .digest("hex")
      .replace(/(.{2})/g, "_$1")
      .replace(/_0(.)/g, "_c$1")
      .replace(/_/g, "");
  }

  private async fetchApiEndpoint<T>(
    url: string,
    method: string = "GET",
    body: string | undefined,
    error: string
  ): Promise<T> {
    const response = await fetch(url, {
      method,
      headers: {
        "User-Agent": "ShinePhone/7.1.0 (iPhone; iOS 16.1.1; Scale/3.00)",
        ...(body !== undefined
          ? { "Content-Type": "application/x-www-form-urlencoded" }
          : {}),
        ...(this.cookies ? { Cookie: this.cookies } : {}),
      },
      body,
    });

    // TODO: handle additional errors
    if (
      !response.ok ||
      // If session is expired, request is redirected
      response.url.includes("errorMess=errorNoLogin")
    ) {
      throw new Error(error);
    }

    // TODO: grab cookies
    this.cookies = response.headers
      .raw()
      ["set-cookie"].map((d: string) => d.split(";")[0])
      .join(";");

    return response.json() as Promise<T>;
  }

  async login() {
    this.cookies = null;

    const error = "Could not login to Growatt server";

    const loginData = await this.fetchApiEndpoint<LoginData>(
      this.loginUrl,
      "POST",
      `userName=${this.username}&password=${this.password}`,
      error
    );

    if (loginData.back.success) {
      this.plants = loginData.back.data;
    } else {
      throw new Error(error);
    }
  }

  async getPlantDevices(plantId: string): Promise<DeviceList[]> {
    const error = `Could not get device list for plant ${plantId} from Growatt server`;

    const plantData = await this.fetchApiEndpoint<PlantData>(
      `${this.plantUrl}?op=getAllDeviceList&plantId=${plantId}`,
      "GET",
      undefined,
      error
    );

    return plantData.deviceList;
  }

  // Returns a prepared list with devices under an account (for usage in pairing flow)
  async getDeviceData(): Promise<DeviceData[]> {
    let devices = [];

    for (let plant of [...this.plants]) {
      await this.login();

      const deviceList = await this.getPlantDevices(plant.plantId);

      const inverters = deviceList.filter((device) =>
        ["inverter", "tlx"].includes(device.deviceType)
      );

      devices.push(
        ...inverters.map((device) => ({
          id: device.deviceSn,
          plantId: plant.plantId,
        }))
      );
    }

    return devices;
  }

  async getInverterProductionData(deviceData: DeviceData) {
    await this.login();

    const deviceList = await this.getPlantDevices(deviceData.plantId);
    const device = deviceList.find(
      (device) => device.deviceSn === deviceData.id
    );

    if (device) {
      return {
        currentPower: Number(device.power),
        energyToday: Number(device.eToday),
      };
    }

    return null;
  }
}
