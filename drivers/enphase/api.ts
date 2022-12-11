import fetch from "node-fetch";

import { EnphaseApiStats, EnphaseApiSystems } from "./types";

export default class EnphaseEnlightenApi {
  private userId: string;
  private apiKey: string;
  private systemId?: string;

  private baseUrl = "https://api.enphaseenergy.com/api/v2";

  constructor(userId: string, apiKey: string, systemId?: string) {
    this.userId = userId;
    this.apiKey = apiKey;
    this.systemId = systemId;
  }

  private async fetchApiEndpoint<T>(url: string): Promise<T> {
    const response = await fetch(url);

    // Handle possible errors
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          "User ID or API key are incorrect, please check your settings."
        );
      } else if (response.status === 409) {
        throw new Error(
          "API key usage limit has been exceeded. Try to increase the interval in the device settings."
        );
      } else if (response.status === 503) {
        throw new Error(
          "Too many concurrent requests made. Are you using other apps with the Enlighten API?"
        );
      } else {
        throw new Error(
          "An unknown error occurred while fetching inverter data."
        );
      }
    }

    return response.json() as Promise<T>;
  }

  getSystems = async (): Promise<EnphaseApiSystems> => {
    const systemsUrl = `${this.baseUrl}/systems?key=${this.apiKey}&user_id=${this.userId}`;

    return this.fetchApiEndpoint(systemsUrl);
  };

  getStats = async (): Promise<EnphaseApiStats> => {
    const statsUrl = `${this.baseUrl}/systems/${this.systemId}/stats?key=${this.apiKey}&user_id=${this.userId}&datetime_format=iso8601`;

    return this.fetchApiEndpoint(statsUrl);
  };
}
