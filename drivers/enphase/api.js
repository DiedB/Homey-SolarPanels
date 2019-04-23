const fetch = require('node-fetch');

const baseUrl = 'https://api.enphaseenergy.com/api/v2';

class EnphaseApi {
    constructor(userId, apiKey, systemId) {
        this.userId = userId;
        this.apiKey = apiKey;
        this.systemId = systemId;
    }

    async apiRequest(url) {
        const apiResponse = await fetch(url);
        const apiData = await apiResponse.json();

        if (apiResponse.ok) {
            return apiData;
        } else {
            throw new Error(apiData)
        }
    }

    createUrl(endpoint, parameters) {
        let url = `${baseUrl}/${endpoint}?key=${this.apiKey}&user_id=${this.userId}`
        if (parameters) {
            url += `&${parameters.join('&')}`;
        }
        return url;
    }

    async getSystems() {
        const url = this.createUrl('systems');
        const apiData = await this.apiRequest(url);

        return apiData.systems;
    }

    async getProductionData() {
        const url = this.createUrl(`systems/${this.systemId}/stats`, ['datetime_format=iso8601'])

        let apiData;
        try {
            apiData = await this.apiRequest(url);
        } catch (error) {
            apiData = null;
        }

        return apiData;
    }
}

module.exports = { EnphaseApi };