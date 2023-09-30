const _importDynamic = new Function("modulePath", "return import(modulePath)");

async function fetch(...args: any) {
  const { default: fetch } = await _importDynamic("node-fetch");
  return fetch(...args);
}

import { SummaryResponse, SystemsResponse } from "./types";

export default class TigoApi {
  private username: string;
  private password: string;
  private systemId?: string;

  private baseUrl = "https://api2.tigoenergy.com/api/v3";

  constructor(username: string, password: string, systemId?: string) {
    this.username = username;
    this.password = password;
    this.systemId = systemId;
  }

  private async fetchApiEndpoint<T>(endpoint: string): Promise<T> {
    const authorizationHeader = `Basic ${Buffer.from(
      `${this.username}:${this.password}`
    ).toString("base64")}`;

    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      headers: {
        Authorization: authorizationHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Handle possible errors
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          "Your Tigo credentials are incorrect, please try again."
        );
      } else {
        throw new Error(
          "An unknown error occurred while fetching inverter data."
        );
      }
    }

    return response.json() as Promise<T>;
  }

  getSummary = async (): Promise<SummaryResponse> => {
    return this.fetchApiEndpoint(`data/summary?system_id=${this.systemId}`);
  };

  getSystems = async (): Promise<SystemsResponse> => {
    return this.fetchApiEndpoint("systems");
  };
}
