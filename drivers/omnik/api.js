const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

const baseUrl = 'https://api.omnikportal.com/v1';
const appId = 10038;
const appKey = 'Ox7yu3Eivicheinguth9ef9kohngo9oo';

const apiRequest = async (url, method, uid, body) => {
    const apiResponse = await fetch(url, {
        method,
        headers: {
            uid,
            appid: appId,
            appkey: appKey
        },
        body
    });

    const apiData = await apiResponse.json();

    if (apiData.error_msg === '') {
        return apiData;
    } else {
        throw new Error(apiData.error_msg);
    }
}

const getUserId = async (username, password) => {
    const accountUrl = `${baseUrl}/user/account_validate`;

    const requestBody = new URLSearchParams();
    requestBody.append('user_email', username);
    requestBody.append('user_password', password);
    requestBody.append('user_type', 1)
    
    const apiData = await apiRequest(accountUrl, 'POST', -1, requestBody);

    return apiData.data.c_user_id;
};

const getPlantList = async (userId) => {
    const plantListUrl = `${baseUrl}/plant/list`;

    const apiData = await apiRequest(plantListUrl, 'GET', userId, null);

    return apiData;
}

const getPlantData = async (userId, plantId) => {
    const plantDataUrl = `${baseUrl}/plant/data?plant_id=${plantId}`;

    const apiData = await apiRequest(plantDataUrl, 'GET', userId, null);

    return apiData;
}

module.exports = { getUserId, getPlantList, getPlantData };