const ModbusRTU = require("modbus-serial");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class HuaweiModbusApi {
    constructor(address) {
        this.address = address;
    }

    getData() {
        return new Promise(async (resolve, reject) => {
            try {
                const client = new ModbusRTU();
                await client.setTimeout(10000);

                // TODO: change port!
                await client.connectTCP(this.address, { port: 502 });
                await client.setID(0);

                // Wait a few seconds after connecting, see https://forum.huawei.com/enterprise/en/forum.php?mod=redirect&goto=findpost&ptid=603386&pid=3364703
                await sleep(2000);

                const inverterModel = (
                    await client.readHoldingRegisters(30000, 15)
                ).buffer.toString();

                const inverterSn = (
                    await client.readHoldingRegisters(30015, 10)
                ).buffer.toString();

                const currentPower = (
                    await client.readHoldingRegisters(32080, 2)
                ).buffer.readInt32BE();

                const currentTemperature =
                    (
                        await client.readHoldingRegisters(32087, 1)
                    ).buffer.readInt16BE() / 10;

                const currentVoltage =
                    (
                        await client.readHoldingRegisters(32066, 1)
                    ).buffer.readInt16BE() / 10;

                const dailyProduction =
                    (
                        await client.readHoldingRegisters(32114, 2)
                    ).buffer.readUInt32BE() / 100;

                resolve({
                    inverterModel,
                    inverterSn,
                    currentPower,
                    currentVoltage,
                    dailyProduction,
                    currentTemperature,
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = { HuaweiModbusApi };
