'use strict';

const Inverter = require('../inverter');
const fetch = require('node-fetch');

const baseUrl = 'https://monitoringapi.solaredge.com/site/';

class SolarEdge extends Inverter {
    getCurrentTimeString() {
        const date = new Date();

        const offsetMs = date.getTimezoneOffset() * 60 * 1000;
        const msLocal =  date.getTime() - offsetMs;
        const dateLocal = new Date(msLocal);
        const iso = dateLocal.toISOString();
        const isoLocal = iso.slice(0, 19).replace('T', ' ');
        return isoLocal;
    }

    getCronString() {
        return '*/15 * * * *'
    }

    checkProduction() {
        this.log('Checking production');

        const data = this.getData();
    
        const currentTimeString = this.getCurrentTimeString();

        // Power values
        const dataUrl = `${baseUrl}${data.sid}/powerDetails?api_key=${data.key}&format=json&startTime=${currentTimeString}&endTime=${currentTimeString}`;

        fetch(dataUrl)
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
                this.log(JSON.stringify(response));
                const meterData = response.powerDetails.meters;

                meterData.forEach(meter => {
                    const currentMeterType = meter.type.toLowerCase();

                    if ((currentMeterType === "production" || currentMeterType === "consumption") && meter.values && meter.values[0].value !== undefined) {
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
                this.setUnavailable(`Error retrieving data (HTTP ${error})`);
            });
    }
}

module.exports = SolarEdge;