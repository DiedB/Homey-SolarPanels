const fetch = require("node-fetch");
import http from "node:http";
import https from "node:https";

import { ProductionData } from "./types";

export default class EnphaseEnvoyApi {
  private address: string;

  constructor(address: string) {
    this.address = address;
  }

  private async fetchApiEndpoint<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      // Allow self-signed SSL (newer Envoy firmware seems to use HTTPS)
      agent: (parsedUrl: URL) => {
        if (parsedUrl.protocol == "http:") {
          return new http.Agent();
        } else {
          return new https.Agent({
            rejectUnauthorized: false,
          });
        }
      },
    });

    // TODO: handle additional errors
    if (!response.ok) {
      throw new Error(
        "An unknown error occurred while fetching inverter data."
      );
    }

    return response.json() as Promise<T>;
  }

  async getProductionData(): Promise<ProductionData> {
    return this.fetchApiEndpoint<ProductionData>(
      `http://${this.address}/production.json?details=1`
    );
  }

  // Get software version to detect upgrade to Envoy v7
  // If this is the case, we direct users to remove and re-add their device
  async getEnvoySoftwareVersion(): Promise<string | null> {
    const response = await fetch(`http://${this.address}/info.xml`, {
      // Allow self-signed SSL (newer Envoy firmware seems to use HTTPS)
      agent: (parsedUrl: URL) => {
        if (parsedUrl.protocol == "http:") {
          return new http.Agent();
        } else {
          return new https.Agent({
            rejectUnauthorized: false,
          });
        }
      },
    });

    const envoyInfo = response.text();

    let regex = /<software>(.*?)<\/software>/;
    let match = envoyInfo.match(regex);
    let softwareVersion = match ? match[1] : null;

    return softwareVersion;
  }
}
