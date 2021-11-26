import { Driver } from "homey";
import PairSession from "homey/lib/PairSession";

import { apsystems } from 'apsystems';

class APsystems extends Driver {

    async onPair(session: PairSession) {
        socket.on('validate', (device, callback) => {

            const ecur = new apsystems.ECUR(device.settings.ip, 8899);
            ecur.getECUdata(async (err: Error, result: Object) => {
                if (err !== null) return callback(new Error(Homey.__('ip_error')));
                callback(null, true);
            });
        });
    }
}

module.exports = APsystems;
