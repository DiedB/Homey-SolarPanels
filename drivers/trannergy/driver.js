'use strict';

const Homey = require('homey');
const SOTGBase = require('../base');

class Trannergy extends SOTGBase.Driver {
    getBaseUrl() {
        return 'http://log.trannergy.com:18000/TrannergyApi/serverapi/';
    }
}

module.exports = Trannergy;