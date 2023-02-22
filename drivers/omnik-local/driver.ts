"use strict";
import { Driver } from "homey";
import PairSession from "homey/lib/PairSession";

const Homey = require("homey");
const { OmnikLocalApi } = require("./api");

class OmnikLocal extends Driver {
    async onPair(session: PairSession) {
        session.setHandler("validate", async ({ ip, sn }) => {
            let omnikLocalApi = new OmnikLocalApi(ip, Number(sn));

            const { inverterName } = await omnikLocalApi.getData();

            return {
                name: inverterName,
                data: {
                    id: Number(sn),
                },
                settings: { ip },
            };
        });
    }
}

module.exports = OmnikLocal;
