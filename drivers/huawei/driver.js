"use strict";

const Homey = require("homey");
const { HuaweiModbusApi } = require("./api");

class Huawei extends Homey.Driver {
    onPair(socket) {
        socket.on("validate", async ({ ip, sn }, callback) => {
            let huaweiModbusApi = new HuaweiModbusApi(ip);

            try {
                const {
                    inverterModel,
                    inverterSn,
                } = await huaweiModbusApi.getData();

                callback(null, {
                    name: `${inverterModel}`,
                    data: {
                        id: inverterSn,
                    },
                    settings: { ip },
                });
            } catch (error) {
                this.error(error);
                callback(error);
            }
        });
    }
}

module.exports = Huawei;
