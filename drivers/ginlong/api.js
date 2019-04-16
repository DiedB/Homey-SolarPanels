const fetch = require('node-fetch');
               //http://apic-cdn.solarman.cn/v/ap.2.0/plant/get_plant_overview?uid=123456&plant_id=12345
const baseUrl = 'http://apic-cdn.solarman.cn/v/ap.2.0/plant';

class GinlongApi {
    constructor(userID, plantID) {
        this.userID = userID;
        this.plantID = plantID;
    }

    async apiRequest(url) {
        const apiResponse = await fetch(url);
        const apiData = await apiResponse.json();

        if (apiResponse.ok) {
            return apiData;
        } else {
            throw new Error(apiData.message.join(', '))
        }
    }

    createUrl(endpoint, parameters) {
        let url = `${baseUrl}/${endpoint}?uid=${this.userID}&plant_id=${this.plantID}`
        if (parameters) {
            url += `&${parameters.join('&')}`;
        }
        return url;
    }

    async getSystems() {
        // http://apic-cdn.solarman.cn/v/ap.2.0/plant/get_plant_device_list?uid=12345&plant_id=98765
        
        const url = this.createUrl('get_plant_device_list');
        const apiData = await this.apiRequest(url);

        return apiData.systems;
    }

    async getProductionData() {
        // http://apic-cdn.solarman.cn/v/ap.2.0/plant/get_plant_overview?uid=12345&plant_id=98765
        
        const url = this.createUrl('get_plant_overview');
        //const url = this.createUrl(`systems/${this.systemId}/stats`, ['datetime_format=iso8601'])
        const apiData = await this.apiRequest(url);

        return apiData.intervals;
    }
}

module.exports = { GinlongApi };
