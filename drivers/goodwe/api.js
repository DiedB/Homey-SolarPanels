const fetch = require('node-fetch');

const loginUrl = 'https://globalapi.sems.com.cn/api/v1/Common/CrossLogin';

class GoodWeApi {
    constructor(username, password, systemId) {
        this.username = username;
        this.password = password;
        this.systemId = systemId;
        this.sessionData = {
            client: 'ios',
            version: 'v2.3.0',
            language: 'en',
        };
        this.apiBaseUrl = undefined;
    }

    async refreshToken() {
        const loginResponse = await this.apiPostRequest(loginUrl, { account: this.username, pwd: this.password});

        this.sessionData = loginResponse.data;
        this.apiBaseUrl = loginResponse.api;
    }

    async apiPostRequest(url, data) {
        const apiResponse = await fetch(url, { method: 'POST', headers: {
            Token: JSON.stringify(this.sessionData),
            'Content-Type': 'application/json'
        }, body: JSON.stringify(data) });
        const apiData = await apiResponse.json();

        if (apiResponse.ok && apiData.code == 0) {
            return apiData;
        } else {
            throw new Error(JSON.stringify(apiData))
        }
    }

    async getSystems() {
        this.refreshToken();

        const url = `${this.apiBaseUrl}PowerStationMonitor/QueryPowerStationMonitorForApp`;
        const apiData = await this.apiPostRequest(url, {
            page_size: 50,
            orderby: '',
            powerstation_status: '',
            key: '',
            page_index: '1',
            powerstation_id: '',
            powerstation_type: ''
        });

        return apiData;
    }

    async getInverterData(id) {
        this.refreshToken();

        const url = `${this.apiBaseUrl}v1/PowerStation/GetMonitorDetailByPowerstationId`;

        return this.apiPostRequest(url, {
            powerStationId: id ? id : this.systemId
        });
    }
}

module.exports = { GoodWeApi };