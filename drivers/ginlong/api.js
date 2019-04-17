const fetch = require('node-fetch');

class GinlongApi {
    constructor(plantId) {
        this.plantId = plantId;
    }

    get BASE_URL() {
        return 'http://apic-cdn.solarman.cn/v/ap.2.0';
    }

    async apiRequest(url) {
        const apiResponse = await fetch(url);
        const apiData = await apiResponse.json();

        if (apiResponse.ok) {
            return apiData;
        } else {
            throw new Error(apiResponse.status)
        }
    }

    createUrl(endpoint) {
        return `${this.BASE_URL}/${endpoint}`;
    }

    async getSystems() {       
        const url = this.createUrl(`plant/get_plant_device_list?plant_id=${this.plantId}`);
        const apiData = await this.apiRequest(url);

        return apiData.invert_list;
    }

    async getProductionData(id) {
        const url = this.createUrl(`device/doInverterDetail?uid=1&deviceId=${id}`);
        const apiData = await this.apiRequest(url);

        return apiData.DeviceWapper;
    }
}

module.exports = { GinlongApi };
