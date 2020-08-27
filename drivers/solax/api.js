const fetch = require('node-fetch');

const baseUrl = 'https://www.solaxcloud.com:9443/proxy/api';

class SolaxApi {
    constructor(tokenId, regNo) {
        this.tokenId = tokenId;
        this.regNo = regNo;
    }

    async apiRequest(url) {
        const apiResponse = await fetch(url);
        const apiData = await apiResponse.json();

        // Todo: Fix code below?
        if (apiResponse.ok && apiData.success) {
            return apiData;
        } else {
            throw new Error(apiData.result)
        }
    }

    async getProductionData() {
        return await this.apiRequest(`${baseUrl}/getRealtimeInfo.do?tokenId=${this.tokenId}&sn=${this.regNo}`);
    }
}

module.exports = { SolaxApi };