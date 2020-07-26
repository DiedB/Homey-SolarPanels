const fetch = require('node-fetch');

class EnphaseEnvoyApi {
    constructor(address) {
        this.address = address;
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

    async getProductionData() {
        return await this.apiRequest(`http://${this.address}/production.json?details=1`);
    }
}

module.exports = { EnphaseEnvoyApi };