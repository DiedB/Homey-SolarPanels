'use strict';

const Homey = require('homey');
const SOTGBase = require('../base');

class SolarMAN extends SOTGBase.Device {
    getBaseUrl() {
        return 'http://www.solarmanpv.com:18000/SolarmanApi/serverapi/';
    }
}

module.exports = SolarMAN;