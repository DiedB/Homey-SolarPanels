'use strict';

const Homey = require('homey');
const Inverter = require('./inverter');

const fetch = require('node-fetch');
const parseXml = require('xml2js').parseString;
const md5 = require('md5');

class SOTGBaseDevice extends Inverter {
    getBaseUrl() {
        throw new Error('Expected override');
    }

    getCronString() {
        return '* * * * *';
    }

    checkProduction() {
        const data = this.getData();
        const currentToken = this.getStoreValue('currentToken');
        const dataUrl = `${this.getBaseUrl()}Data?username=${data.username}&stationid=${data.sid}&token=${currentToken}&key=apitest`;

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

                    return result.text();
                } else {
                    throw result.status;
                }
            })
            .then(body => {
                parseXml(body, (error, result) => {
                    if (!error && !result.error) {
                        if (!this.getAvailable()) {
                            this.setAvailable().then(result => {
                                this.log('Available');
                            }).catch(error => {
                                this.error('Setting availability failed');
                            })
                        }

                        const lastUpdate = Number(result.data.detail[0].lastupdated[0]);
                        if (lastUpdate !== this.getStoreValue('lastUpdate')) {
                            this.setStoreValue('lastUpdate', lastUpdate).catch(error => {
                                this.error('Failed setting last update value');
                            });

                            var energy = Number(result.data.detail[0].WiFi[0].inverter[0].etoday[0]);
                            device.energy = energy;
                            module.exports.realtime(device_data, "meter_power", energy);

                            var power = Number(result.data.detail[0].WiFi[0].inverter[0].power[0]) * 1000;
                            device.power = power;
                            module.exports.realtime(device_data, "measure_power", power);

                            Homey.log("[" + device_data.name + "] Energy: " + energy + "kWh");
                            Homey.log("[" + device_data.name + "] Power: " + power + "W");
                        } else {
                            Homey.log("[" + device_data.name + "] No new data");
                        }
                    } else {
                        this.getToken()
                            .then(result => {
                                this.checkProduction();
                            })
                            .catch(error => {
                                this.setUnavailable('Authorization failed').then(result => {
                                    this.log('Unavailable');
                                }).catch(error => {
                                    this.error('Setting availability failed');
                                })
                            });
                    }
                });
            });
    }

    getToken() {
        const data = this.getData();
        const hashedPassword = md5(data.password);
        const tokenUrl = `${this.getBaseUrl()}Login?username=${data.username}&password=${hashedPassword}&key=apitest`;

        fetch(tokenUrl)
            .then(result => {
                if (result.ok) {
                    return result.text();
                } else {
                    throw result.status;
                }
            })
            .then(body => {
                parseXml(body, (error, result) => {
                    if (!error && !result.error) {
                        this.log('Retrieved new token');
                        this.setStoreValue('currentToken', result.login.token[0]).catch(error => {
                            this.error('Failed saving token');
                        });
                        return Promise.resolve(true);
                    } else {
                        this.log('Could not retrieve new token');
                        throw result.error;
                    }
                });
            })
            .catch(error => {
                this.log(`Unavailable (${error})`);
                this.setUnavailable(`Error retrieving token (${error})`);
                return Promise.reject(new Error(error));
            })
    }
}

module.exports = SOTGBaseDevice;