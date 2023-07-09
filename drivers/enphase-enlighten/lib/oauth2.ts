const { OAuth2Client, OAuth2Error } = require("homey-oauth2app");
const fetch = require("node-fetch");
const Homey = require("homey");

import { ApiSystems, ApiSystemSummary } from "../types";

class EnphaseOAuth2Client extends OAuth2Client {
  static API_URL = "https://api.enphaseenergy.com/api/v4";
  static TOKEN_URL = "https://api.enphaseenergy.com/oauth/token";
  static AUTHORIZATION_URL = "https://api.enphaseenergy.com/oauth/authorize";
  static SCOPES = [];

  // Overriding this because Enphase wants client_id and client_secret in Authorization header
  async onGetTokenByCode({ code }: { code: string }) {
    const body = new URLSearchParams();
    body.append("grant_type", "authorization_code");
    body.append("code", code);
    body.append("redirect_uri", this._redirectUrl);

    const base64Token = Buffer.from(
      `${this._clientId}:${this._clientSecret}`
    ).toString("base64");

    const response = await fetch(this._tokenUrl, {
      body,
      method: "POST",
      headers: {
        Authorization: `Basic ${base64Token}`,
      },
    });
    if (!response.ok) {
      return this.onHandleGetTokenByCodeError({ response });
    }

    this._token = await this.onHandleGetTokenByCodeResponse({ response });
    return this.getToken();
  }

  // Overriding this because Enphase wants client_id and client_secret in Authorization header
  async onRefreshToken() {
    const token = this.getToken();
    if (!token) {
      throw new OAuth2Error("Missing Token");
    }

    this.debug("Refreshing token...");

    if (!token.isRefreshable()) {
      throw new OAuth2Error("Token cannot be refreshed");
    }

    const body = new URLSearchParams();
    body.append("grant_type", "refresh_token");
    body.append("refresh_token", token.refresh_token);

    const base64Token = Buffer.from(
      `${this._clientId}:${this._clientSecret}`
    ).toString("base64");

    const response = await fetch(this._tokenUrl, {
      body,
      method: "POST",
      headers: {
        Authorization: `Basic ${base64Token}`,
      },
    });
    if (!response.ok) {
      return this.onHandleRefreshTokenError({ response });
    }

    this._token = await this.onHandleRefreshTokenResponse({ response });

    this.debug("Refreshed token!", this._token);
    this.save();

    return this.getToken();
  }

  async onRequestQuery({ query }: { query: any }) {
    return { ...query, key: Homey.env.API_KEY };
  }

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
