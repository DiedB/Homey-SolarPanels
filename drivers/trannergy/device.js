'use strict';

const TranneryBase = require('./base');

class Trannergy extends TranneryBase.Device {
    getBaseUrl() {
        return 'http://oldapi.trannergy.com:18000/TrannergyApi/serverapi/';
    }
}

module.exports = Trannergy;
