const fetch = require('node-fetch');

const loginUrl = 'https://globalapi.sems.com.cn/api/v1/Common/CrossLogin';


class GoodWeApi {
    constructor(username, password, systemId) {
        this.username = username;
        this.password = password;
        this.systemId = systemId;
    }

    async apiGetRequest(url) {
        const apiResponse = await fetch(url);
        const apiData = await apiResponse.json();

        if (apiResponse.ok) {
            return apiData;
        } else {
            throw new Error(apiData)
        }
    }

    async apiPostRequest(url, data) {
        const apiResponse = await fetch(url, { method: 'POST', headers: {
            Token: '{"client":"ios","version":"v2.1.0","language":"en"}',
            'Content-Type': 'application/json'
        }, body: JSON.stringify(data) });
        const apiData = await apiResponse.json();

        if (apiResponse.ok) {
            return apiData;
        } else {
            throw new Error(apiData)
        }
    }

    async getToken() {
        const loginResponse = await this.apiPostRequest(loginUrl, { account: this.username, pwd: this.password});
        return loginResponse;
    }

    async getSystems() {
        const url = this.createUrl('systems');
        const apiData = await this.apiRequest(url);

        return apiData.systems;
    }

    async getProductionData() {
        const url = this.createUrl(`systems/${this.systemId}/stats`, ['datetime_format=iso8601'])

        try {
            return (await this.apiRequest(url)).intervals;
        } catch (error) {
            return null;
        }
    }
}

module.exports = { GoodWeApi };