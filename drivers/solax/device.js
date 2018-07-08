'use strict';

const Inverter = require('../inverter');
const fetch = require('node-fetch');

const baseUrl = 'https://www.solax-portal.com/api/v1/';

class Solax extends Inverter {
    
    checkProduction() {
        this.log('Checking production');

        const data = this.getData();

        const currentToken = this.getStoreValue('currentToken');
        const dataUrl = `${baseUrl}site/overview/${data.sid}?&token=${currentToken}`;

        fetch(dataUrl)
        .then(result => {
            if (result.ok) {
                if (!this.getAvailable()) {
                    this.setAvailable().then(result => {
                        this.log('Available');
                    }).catch(error => {
                        this.error('Setting availability failed');
                    })
                }
                return result.json();
            } else {
                throw result.status;
            }   
        })
        .then(response => {
            if (!(response.data.errorCode == 9001)) {
                const lastUpdate = response.data.lastUpdateTime;

                if (lastUpdate !== this.getStoreValue('lastUpdate')) {
                    this.setStoreValue('lastUpdate', lastUpdate).catch(error => {
                         this.error('Failed setting last update value');
                    });

                    const currentEnergy = Number(response.data.energyToday);
                    this.setCapabilityValue('meter_power', currentEnergy);
                    this.log(`Current energy is ${currentEnergy}kWh`);
                    
                    const currentPower = Number(response.data.power);
                    this.setCapabilityValue('measure_power', currentPower);
                    this.log(`Current power is ${currentPower}W`);
                } else {
                    this.log(`No new data`);
                }
            } else {
                this.log('Token expired, getting new token');
                this.getToken(baseUrl, data.username, data.password)
                    .then(token => {
                        this.setStoreValue('currentToken', token).catch(error => {
                            this.error('Failed setting new token');
                        });
                        this.checkProduction();
                    })
                    .catch(error => {
                        this.error('Authorization failed');
                        this.setUnavailable('Authorization failed').catch(error => {
                            this.error('Setting availability failed');
                        })
                    });
                }
        })
        .catch(error => {
            this.log(`Unavailable (${error})`);
            this.setUnavailable(`Error retrieving data (HTTP ${error})`);
        });

    }

    getToken(url, username, password) {
        return new Promise((resolve, reject) => {

        const tokenUrl = `${url}user/Login?username=${username}&password=${password}`;

        fetch(tokenUrl)
            .then(result => {
                if (result.ok) {
                    return result.json();
                } else {
                    throw result.status;
                }   
            })
            .then(response => {
                if (response.successful === true){
                    resolve(response.data.token);
                } else {
                    this.log(`Problem getting token`);
                }

            })
            .catch(error => {
                this.log(`Token Unavailable (${error})`);
                reject(error);
            });
        });

    }

}

module.exports = Solax;