import fetch from "node-fetch";

import { StatusData } from "./types";

export default class PvOutputApi {
  private apiKey: string;
  private systemId: string;

  private baseUrl = "https://pvoutput.org/service/r2";

  constructor(systemId: string, apiKey: string) {
    this.systemId = systemId;
    this.apiKey = apiKey;
  }

  private async fetchApiEndpoint(
    endpoint: string,
    params?: string
  ): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/${endpoint}?key=${this.apiKey}&sid=${this.systemId}${
        params || ""
      }`
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

    return response.text() as Promise<string>;
  }

  async getStatusData(extended?: boolean): Promise<StatusData> {
    const systemInfo = await this.fetchApiEndpoint(
      "getstatus.jsp",
      extended ? "&ext=1" : undefined
    );

    const parsedInfo = systemInfo.split(",");

    return {
      dailyProductionEnergy: parseInt(parsedInfo[2]) / 1000,
      currentProductionPower: parseInt(parsedInfo[3]),
      dailyConsumptionEnergy: parseInt(parsedInfo[4]) / 1000,
      currentConsumptionPower: parseInt(parsedInfo[5]),
      currentTemperature: parseFloat(parsedInfo[7]),
      currentVoltage: parseFloat(parsedInfo[8]),
      extendedFields: extended ? parsedInfo.slice(9) : undefined,
    };
  }

  async getSystemName(): Promise<string> {
    const systemData = await this.fetchApiEndpoint("getsystem.jsp");

    return systemData.split(",")[0];
  }
}
