"use strict";

const Homey = require("homey");
const { OmnikLocalApi } = require("./api");

class OmnikLocal extends Homey.Driver {
    onPair(socket) {
        socket.on("validate", async ({ ip, sn }, callback) => {
            let omnikLocalApi = new OmnikLocalApi(ip, Number(sn));

            try {
                const { inverterName } = await omnikLocalApi.getData();

                callback(null, {
                    name: inverterName,
                    data: {
                        id: Number(sn),
                    },
                    settings: { ip },
                });
            } catch (error) {
                callback(error);
            }
        });
    }
}

module.exports = OmnikLocal;
