'use strict';

const TrannergyBase = require('./base');

class Trannergy extends TrannergyBase.Driver {
    getBaseUrl() {
        return 'http://oldapi.trannergy.com:18000/TrannergyApi/serverapi/';
    }
}

module.exports = Trannergy;
