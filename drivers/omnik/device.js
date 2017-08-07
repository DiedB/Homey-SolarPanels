'use strict';

const Homey = require('homey');
const SOTGBaseDevice = require('../sotg');

class Omnik extends SOTGBaseDevice {
    getBaseUrl() {
        return 'http://www.omnikportal.com:8080/OmnikApi/serverapi/';
    }
}

module.exports = Omnik;