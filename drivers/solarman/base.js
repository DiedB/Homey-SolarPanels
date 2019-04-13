'use strict';

const Homey = require('homey');
const Inverter = require('../inverter');

const fetch = require('node-fetch');
const parseXml = require('xml2js').parseString;
const md5 = require('md5');

class SOTGBase {
    static getToken(url, username, password) {
        return new Promise((resolve, reject) => {
            const hashedPassword = md5(password);
            const tokenUrl = `${url}Login?username=${username}&password=${hashedPassword}&key=apitest`;

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
                            resolve(result.login.token[0]);
                        } else {
                            throw result.error.errorMessage[0];
                        }
                    });
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    static getInverters(url, sid, username, password, token) {
        return new Promise(resolve => {
            const dataUrl = `${url}Data?username=${username}&stationid=${sid}&token=${token}&key=apitest`;

            fetch(dataUrl)
                .then(result => {
                    if (result.ok) {
                        return result.text();
                    } else {
                        throw result.status;
                    }
                })
                .then(body => {
                    parseXml(body, (error, result) => {
                        if (!error & !result.error) {
                            const devicesList = result.data.detail[0].WiFi.reduce((devices, currentInverter) => {
                                devices.push({
                                    name: currentInverter.inverter[0].SN[0],
                                    data: {
                                        id: currentInverter.id[0],
                                        sid
                                    },
                                    settings: { username, password }
                                });
                                return devices;
                            }, []);
                            resolve(devicesList);
                        } else {
                            throw result.error.errorMessage[0];
                        }
                    });
                });
        });
    }
}

class SOTGBaseDriver extends Homey.Driver {
    getBaseUrl() {
        throw new Error('Expected override');
    }

    onPair(socket) {
        let systemData = null;
        let currentToken = null;

        socket.on('validate', (data, callback) => {
            SOTGBase.getToken(this.getBaseUrl(), data.username, data.password)
                .then(token => {
                    systemData = data;
                    currentToken = token;
                    callback(null, true);
                })
                .catch(error => {
                    this.error(error);
                    callback(new Error(error));
                });
        });

        socket.on('list_devices', (_, callback) => {
            SOTGBase.getInverters(this.getBaseUrl(), systemData.sid, systemData.username, systemData.password, currentToken)
                .then(devices => {
                    callback(null, devices);
                });
        });
    }
}

class SOTGBaseDevice extends Inverter {
    getBaseUrl() {
        throw new Error('Expected override');
    }

    getCronString() {
        return '* * * * *';
    }

    checkProduction() {
        this.log('Checking production');

        const data = this.getData();
        const settings = this.getSettings();
        const currentToken = this.getStoreValue('currentToken');
        const dataUrl = `${this.getBaseUrl()}Data?username=${settings.username}&stationid=${data.sid}&token=${currentToken}&key=apitest`;

        fetch(dataUrl)
            .then(result => {
                if (result.ok) {
                    if (!this.getAvailable()) {
                        this.log('Available');
                        this.setAvailable().catch(error => {
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
                        const liveData = result.data.detail[0].WiFi.find((inverter) => {
                            return inverter.id[0] === data.id;
                        });

                        const lastUpdate = Number(liveData.inverter[0].lastupdated[0]);
                        if (lastUpdate !== this.getStoreValue('lastUpdate')) {
                            this.setStoreValue('lastUpdate', lastUpdate).catch(error => {
                                this.error('Failed setting last update value');
                            });

                            const currentEnergy = Number(liveData.inverter[0].etoday[0]);
                            this.setCapabilityValue('meter_power.production', currentEnergy);

                            const currentPower = Number(liveData.inverter[0].power[0]) * 1000;
                            this.setCapabilityValue('measure_power.production', currentPower);

                            this.log(`Current energy is ${currentEnergy}kWh`);
                            this.log(`Current power is ${currentPower}W`);
                        } else {
                            this.log(`No new data`);
                        }
                    } else {
                        this.log('Token expired, getting new token');
                        SOTGBase.getToken(this.getBaseUrl(), settings.username, settings.password)
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
                });
            });
    }
}

module.exports = {
    Driver: SOTGBaseDriver,
    Device: SOTGBaseDevice
};