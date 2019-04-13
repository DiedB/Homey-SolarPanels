'use strict';

const Inverter = require('../inverter');
const fetch = require('node-fetch');

const baseUrl = 'https://monitoringapi.solaredge.com/site/';

class SolarEdge extends Inverter {
    getCurrentIsoString() {
        const date = new Date();
        const offsetMs = date.getTimezoneOffset() * 60 * 1000;
        const msLocal =  date.getTime() - offsetMs;
        const dateLocal = new Date(msLocal);
        const iso = dateLocal.toISOString();
        const isoLocal = iso.slice(0, 19).replace('T', ' ');

        return isoLocal;
    }

    getCurrentDateString() {
        return this.getCurrentIsoString().slice(0, 10);
    }

    getCronString() {
        return '*/10 * * * *'
    }

    checkProduction() {
        this.log('Checking production');

        const data = this.getData();
        const settings = this.getSettings();
    
        const currentIsoString = this.getCurrentIsoString();
        const currentDateString = this.getCurrentDateString();

        // Power values
        const powerDataUrl = `${baseUrl}${data.sid}/powerDetails?api_key=${settings.key}&format=json&startTime=${currentIsoString}&endTime=${currentIsoString}`;
        fetch(powerDataUrl)
            .then(result => {
                if (result.ok || result.status === 304) {
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
                const meterData = response.powerDetails.meters;

                meterData.forEach(meter => {
                    const currentMeterType = meter.type.toLowerCase();

                    if ((currentMeterType === "production" || currentMeterType === "consumption") && meter.values.length > 0 && meter.values[0].value !== undefined) {
                        const currentValue = Math.round(meter.values[0].value);

                        this.setCapabilityValue(`measure_power.${currentMeterType}`, currentValue);

                        this.log(`Current ${currentMeterType} power is ${currentValue}W`);
                    } else {
                        this.log(`No new data for ${currentMeterType}`);
                    }
                })
            })
            .catch(error => {
                this.log(`Unavailable (${error})`);
                this.setUnavailable(`Error retrieving data (${error})`);
            });

        // Energy values
        const energyDataUrl = `${baseUrl}${data.sid}/energyDetails?api_key=${settings.key}&format=json&startTime=${currentDateString} 00:00:00&endTime=${currentDateString} 23:59:59`;
        fetch(energyDataUrl)
            .then(result => {
                if (result.ok || result.status === 304) {
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
                const meterData = response.energyDetails.meters;

                meterData.forEach(meter => {
                    const currentMeterType = meter.type.toLowerCase();

                    if ((currentMeterType === "production" || currentMeterType === "consumption") && meter.values.length > 0 && meter.values[0].value !== undefined) {
                        const currentValue = Math.round(meter.values[0].value) / 1000;

                        this.setCapabilityValue(`meter_power.${currentMeterType}`, currentValue);

                        this.log(`Current ${currentMeterType} energy is ${currentValue}kWh`);
                    } else {
                        this.log(`No new data for ${currentMeterType}`);
                    }
                })
            })
            .catch(error => {
                this.log(`Unavailable (${error})`);
                this.setUnavailable(`Error retrieving data (${error})`);
            });

    }
}

module.exports = SolarEdge;