const { OAuth2Client } = require("homey-oauth2app");

import { ApiSystems, ApiSystemSummary } from "../types";

class EnphaseOAuth2Client extends OAuth2Client {
  static API_URL = "https://api.enphaseenergy.com/api/v4";
  static TOKEN_URL = "https://api.enphaseenergy.com/oauth/token";
  static AUTHORIZATION_URL = "https://api.enphaseenergy.com/oauth/authorize";
  static SCOPES = ["read"];

  async getSystems(): Promise<ApiSystems> {
    return this.get({
      path: "/systems",
    });
  }

  async getSystemSummary(systemId: number): Promise<ApiSystemSummary> {
    return this.get({
      path: `/systems/${systemId}/summary`,
    });
  }
}

module.exports = EnphaseOAuth2Client;
export default EnphaseOAuth2Client;
