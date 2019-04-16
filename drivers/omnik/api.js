const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

const baseUrl = 'https://api.omnikportal.com/v1';
const appId = 10038;
const appKey = 'Ox7yu3Eivicheinguth9ef9kohngo9oo';

class OmnikApi {
    constructor(username, password) {
        this.username = username;
        this.password = password;
        this.userId = -1;
    }

    async initializeSession() {
        const accountUrl = `${baseUrl}/user/account_validate`;
    
        const requestBody = new URLSearchParams();
        requestBody.append('user_email', this.username);
        requestBody.append('user_password', this.password);
        requestBody.append('user_type', 1)
        
        const apiData = await this.apiRequest(accountUrl, 'POST', requestBody);
    
        this.userId = apiData.data.c_user_id;
    }

    async apiRequest(url, method, body) {
        const apiResponse = await fetch(url, {
            method,
            headers: {
                uid: this.userId,
                appid: appId,
                appkey: appKey
            },
            body
        });

        const apiData = await apiResponse.json();

        if (apiData.error_msg === '') {
            return apiData;
        }
        
        throw new Error(apiData.error_msg);
    }

    async getSystems() {
        const systemsUrl = `${baseUrl}/plant/list`;

        const apiData = await this.apiRequest(systemsUrl, 'GET', null);

        return apiData;
    }

    async getProductionData(systemId) {
        const productionDataUrl = `${baseUrl}/plant/data?plant_id=${systemId}`;

        const apiData = await this.apiRequest(productionDataUrl, 'GET', null);

        return apiData;
    }
}

module.exports = { OmnikApi };