'use strict';

const Inverter = require('../../inverter');
const apsystems = require('apsystems');

class APsystemsECUR extends Inverter {

    checkProduction() {
        const currentTime = Math.floor(Date.now()/1000);
        this.log('Checking production');

        const self = this;
        const settings = this.getSettings();
        const ecur = new apsystems.ECUR(settings.ip, 8899);

        if(this.last_check !== null){
            const time_diff = currentTime - this.last_check;
            if(time_diff < 60) return;  // Ensure only max 1 check pm
        }

        ecur.getECUdata(function(data) {

            self.setCapabilityValue('meter_power', data.today_energy);
            self.setCapabilityValue('measure_power', data.current_power);

            self.log(`Current energy is ${data.today_energy}kWh`);
            self.log(`Current power is ${data.current_power}W`);

            self.last_check = currentTime;
        });
    }
}

module.exports = APsystemsECUR;
