const fetch = require("node-fetch");

import { StatusData } from "./types";

export default class PvOutputApi {
  private apiKey: string;
  private systemId: string;

  private baseUrl = "https://pvoutput.org/service/r2";

  constructor(systemId: string, apiKey: string) {
    this.systemId = systemId;
    this.apiKey = apiKey;
  }

  private async fetchApiEndpoint<T>(endpoint: string): Promise<T> {
    const response = await fetch(
      `${this.baseUrl}/${endpoint}?key=${this.apiKey}&sid=${this.systemId}&d=20170803`,
      { headers: { "X-Rate-Limit": 1 } }
    );

    // Handle possible errors
    if (!response.ok) {
      if (response.status === 400) {
        throw new Error(
          "Could not find production data, is the system active?"
        );
      } else if (response.status === 401) {
        throw new Error(
          "System ID or API key are incorrect, please check your settings."
        );
      } else if (response.status === 403) {
        throw new Error(
          "API key usage limit has been exceeded. Try to increase the interval in the device settings."
        );
      } else {
        throw new Error(
          "An unknown error occurred while fetching inverter data."
        );
      }
    }

    return response.text() as Promise<T>;
  }

  async getStatusData(): Promise<StatusData> {
    const systemInfo = await this.fetchApiEndpoint<string>("getstatus.jsp");

    const parsedInfo = systemInfo.split(",");

    return {
      currentPower: parseInt(parsedInfo[3]),
      dailyYield: parseInt(parsedInfo[2]) / 1000,
      currentTemperature: parseInt(parsedInfo[7]),
      currentVoltage: parseInt(parsedInfo[8]),
    };
  }

  async getSystemName(): Promise<string> {
    const systemData = await this.fetchApiEndpoint<string>("getsystem.jsp");

    return systemData.split(",")[0];
  }
}
