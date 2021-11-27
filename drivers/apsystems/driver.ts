import { Driver } from "homey";
import PairSession from "homey/lib/PairSession";
import { DeviceSettings, EcurData } from "./types";

import { apsystems } from 'apsystems';

class APsystems extends Driver {

    async onPair(session: PairSession) {
        session.setHandler('validate', async (data: DeviceSettings) => {

            const ecur = new apsystems.ECUR(data.ip, 8899);
            ecur.getECUdata(async (err: Error, result: EcurData) => {
                if (err !== null) new Error(this.homey.__('ip_error'));
            });
        });
    }
}

module.exports = APsystems;
