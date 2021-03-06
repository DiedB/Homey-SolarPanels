'use strict';

const Inverter = require('../../inverter');
const fetch = require('node-fetch');

const baseUrl = 'https://monitoringapi.solaredge.com';

class SolarEdge extends Inverter {
    getCurrentIsoString() {
        const date = new Date();
        return this.getIsoString(date);
    }

    getIsoStringFromPast(minutes_offset) {
        // subtract 10 minutes from now
        const now = new Date()
        const date = new Date(now.getTime() - minutes_offset * 60000)
        return this.getIsoString(date);
    }

    getCurrentDateString() {
        return this.getCurrentIsoString().slice(0, 10);
    }

    getIsoString(date) {
        const offsetMs = date.getTimezoneOffset() * 60 * 1000;
        const msLocal =  date.getTime() - offsetMs;
        const dateLocal = new Date(msLocal);
        const iso = dateLocal.toISOString();
        return iso.slice(0, 19).replace('T', ' ');
    }

    getCronString() {
        // Execute every 50th second of a minute, because
        // SolarEdge needs around 40 seconds to process and
        // calculate/flatten their results.
        return '50 */15 * * * * '
    }

    checkProduction() {
        this.log('Checking production');

        const data = this.getData();
        const settings = this.getSettings();
    
        const currentIsoString = this.getCurrentIsoString();
        const currentDateString = this.getCurrentDateString();

        // Power values
        const startTime = this.getIsoStringFromPast(1);
        const powerDataUrl = `${baseUrl}/site/${data.sid}/powerDetails?api_key=${settings.key}&format=json&meters=Production,Consumption&startTime=${startTime}&endTime=${currentIsoString}`;
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

                    if (meter.values.length > 0 && meter.values[0].value !== undefined) {
                        const currentValue = Math.round(meter.values[0].value);

                        const capabilityId = currentMeterType === 'production' ? 'measure_power' : 'consumption';

                        // Check if consumption is supported, add capability if needed
                        if (capabilityId === 'consumption' && !this.hasCapability(capabilityId)) {
                            this.addCapability(capabilityId);
                        }

                        this.setCapabilityValue(capabilityId, currentValue);

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
        const energyDataUrl = `${baseUrl}/site/${data.sid}/energyDetails?api_key=${settings.key}&format=json&meters=Production,Consumption&startTime=${currentDateString} 00:00:00&endTime=${currentDateString} 23:59:59`;
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

                    if (meter.values.length > 0 && meter.values[0].value !== undefined) {
                        const currentValue = Math.round(meter.values[0].value) / 1000;

                        const capabilityId = currentMeterType === 'production' ? 'meter_power' : 'daily_consumption';

                        // Check if consumption is supported, add capability if needed
                        if (capabilityId === 'daily_consumption' && !this.hasCapability(capabilityId)) {
                            this.addCapability(capabilityId);
                        }

                        this.setCapabilityValue(capabilityId, currentValue);

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

        // Equipment values (inverter temperature)
        if (this.hasCapability("measure_temperature") && data.serial_number) {
            // Only fetch equipment if inverter serialnumber is known and has capability
            const startTime = this.getIsoStringFromPast(10);
            const equipmentDataUrl = `${baseUrl}/equipment/${data.sid}/${data.serial_number}/data?api_key=${settings.key}&format=json&startTime=${startTime}&endTime=${currentIsoString}`;
            fetch(equipmentDataUrl)
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
                    const telemetries = response.data.telemetries;

                    telemetries.forEach(telemetry => {
                        if (telemetry && telemetry.temperature !== undefined) {
                            this.setCapabilityValue("measure_temperature", telemetry.temperature);

                            this.log(`Current inverter temperature is ${telemetry.temperature} degrees Celsius`);
                        } else {
                            this.log(`No inverter temperature found`);
                        }
                    })
                })
                .catch(error => {
                    this.log(`Unavailable (${error})`);
                    this.setUnavailable(`Error retrieving data (${error})`);
                });
        }
    }
}

module.exports = SolarEdge;