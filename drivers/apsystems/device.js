'use strict';

const Inverter = require('../../inverter');
const apsystems = require('apsystems');

class APsystemsECUR extends Inverter {

    getCronString() {
        return '* * * * *';
    }

    checkProduction() {
        this.log('Checking production');

        const self = this;
        const settings = this.getSettings();

        const ecur = new apsystems.ECUR(settings.ip, 8899);
        ecur.getECUdata(function(err, result) {

            // Handle error
            if (err ) {
                this.log(`Unavailable (${error})`);
                this.setUnavailable(`Error retrieving data (${error})`);

                return;
            }

            // Verify availability
            if (!this.getAvailable()) {
                this.setAvailable().then(_ => {
                    this.log('Available');
                }).catch(error => {
                    this.error('Setting availability failed');
                })
            }

            // Set capabilities
            self.setCapabilityValue('meter_power', result.today_energy);
            self.setCapabilityValue('measure_power', result.current_power);

            self.log(`Current energy is ${result.today_energy}kWh`);
            self.log(`Current power is ${result.current_power}W`);
        });
    }
}

module.exports = APsystemsECUR;
