const fetch = require("node-fetch");

import {
  PowerResponse,
  EnergyResponse,
  EquipmentListResponse,
  EquipmentDataResponse,
  SitesResponse,
} from "./types";

export default class SolarEdgeApi {
  private apiKey: string;
  private siteId?: number;
  private serialNumber?: string;

  private baseUrl = "https://monitoringapi.solaredge.com";

  constructor(apiKey: string, siteId?: number, serialNumber?: string) {
    this.siteId = siteId;
    this.apiKey = apiKey;
    this.serialNumber = serialNumber;
  }

  private static getCurrentIsoString(): string {
    return this.getIsoString(new Date());
  }

  private static getIsoStringFromPast(minutes_offset: number) {
    // Subtract 10 minutes from now
    const now = new Date();
    const date = new Date(now.getTime() - minutes_offset * 60000);
    return this.getIsoString(date);
  }

  private static getCurrentDateString(): string {
    return this.getCurrentIsoString().slice(0, 10);
  }

  private static getIsoString(date: Date): string {
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    const msLocal = date.getTime() - offsetMs;
    const dateLocal = new Date(msLocal);
    const iso = dateLocal.toISOString();
    return iso.slice(0, 19).replace("T", " ");
  }

  private async fetchApiEndpoint<T>(url: string): Promise<T> {
    const response = await fetch(url);

    // Handle possible errors
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(
          "System ID or API key are incorrect, please check your settings"
        );
      } else if (response.status === 429) {
        throw new Error(
          "API key usage limit has been exceeded. Try to increase the interval in the device settings"
        );
      } else {
        throw new Error(
          "An unknown error occurred while fetching inverter data"
        );
      }
    }

    return response.json() as Promise<T>;
  }

  checkSettings = async (): Promise<void> => {
    if (!this.apiKey || !this.siteId) {
      throw new Error("Please check your settings and try again");
    }

    const equipmentUrl = `${this.baseUrl}/equipment/${this.siteId}/list?api_key=${this.apiKey}&format=json`;

    try {
      const equipmentListResponse =
        this.fetchApiEndpoint<EquipmentListResponse>(equipmentUrl);

      if ((await equipmentListResponse).reporters.count < 1) {
        throw new Error("No SolarEdge inverters were found in this site");
      }
    } catch (e) {
      // Check if equipment is available within site
    }
  };

  getSites = async (): Promise<SitesResponse> => {
    const sitesUrl = `${this.baseUrl}/sites/list?api_key=${this.apiKey}&format=json`;

    return this.fetchApiEndpoint(sitesUrl);
  };

  getPowerData = async (): Promise<PowerResponse> => {
    const currentIsoString = SolarEdgeApi.getCurrentIsoString();

    // Power values
    const startTime = SolarEdgeApi.getIsoStringFromPast(1);
    const powerDataUrl = `${this.baseUrl}/site/${this.siteId}/powerDetails?api_key=${this.apiKey}&format=json&meters=Production,Consumption&startTime=${startTime}&endTime=${currentIsoString}`;

    return this.fetchApiEndpoint<PowerResponse>(powerDataUrl);
  };

  getEnergyData = async (): Promise<EnergyResponse> => {
    const currentDateString = SolarEdgeApi.getCurrentDateString();

    const energyDataUrl = `${this.baseUrl}/site/${this.siteId}/energyDetails?api_key=${this.apiKey}&format=json&meters=Production,Consumption&startTime=${currentDateString} 00:00:00&endTime=${currentDateString} 23:59:59`;

    return this.fetchApiEndpoint<EnergyResponse>(energyDataUrl);
  };

  getEquipmentList = async (): Promise<EquipmentListResponse> => {
    const equipmentUrl = `${this.baseUrl}/equipment/${this.siteId}/list?api_key=${this.apiKey}&format=json`;

    return this.fetchApiEndpoint<EquipmentListResponse>(equipmentUrl);
  };

  getEquipmentData = async (): Promise<EquipmentDataResponse> => {
    const currentIsoString = SolarEdgeApi.getCurrentIsoString();
    const startTime = SolarEdgeApi.getIsoStringFromPast(10);

    const equipmentDataUrl = `${this.baseUrl}/equipment/${this.siteId}/${this.serialNumber}/data?api_key=${this.apiKey}&format=json&startTime=${startTime}&endTime=${currentIsoString}`;

    return this.fetchApiEndpoint<EquipmentDataResponse>(equipmentDataUrl);
  };
}
