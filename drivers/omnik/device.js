'use strict';

const Homey = require('homey');
const SOTGBase = require('../sotg');

class Omnik extends SOTGBase.Device {
    getBaseUrl() {
        return 'http://www.omnikportal.com:8080/OmnikApi/serverapi/';
    }
}

module.exports = Omnik;