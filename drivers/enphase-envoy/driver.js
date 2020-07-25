'use strict';

const Homey = require('homey');

class EnphaseEnvoy extends Homey.Driver {
    onPairListDevices(data, callback) {
        const discoveryStrategy = this.getDiscoveryStrategy();
        const discoveryResults = discoveryStrategy.getDiscoveryResults();

        this.log(discoveryResults);
        
        const devices = Object.values(discoveryResults).map(discoveryResult => ({
            name: discoveryResult.txt.name,
            data: {
                id: discoveryResult.id,
            }
        }));

        callback(null, devices);
    }
}

module.exports = EnphaseEnvoy;