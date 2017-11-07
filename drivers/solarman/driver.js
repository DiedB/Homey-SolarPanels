'use strict';

const Homey = require('homey');
const SOTGBase = require('../base');

class SolarMAN extends SOTGBase.Driver {
    getBaseUrl() {
        return 'http://213.136.73.47:18000/SolarmanApi/serverapi/';
    }
}

module.exports = SolarMAN;