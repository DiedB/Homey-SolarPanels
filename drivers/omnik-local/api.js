const net = require("net");

class OmnikLocalApi {
    constructor(address, wifiSn) {
        this.address = address;
        this.wifiSn = wifiSn;
    }

    getData() {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            client.connect(8899, this.address);
            client.setTimeout(10000);

            client.on("data", (data) => {
                const inverterName = data.slice(15, 31).toString();
                const currentPower =
                    data.readUInt16BE(59) +
                    data.readUInt16BE(63) +
                    data.readUInt16BE(67);
                const dailyProduction = data.readUInt16BE(69) / 100;
                const voltageArray = [
                    data.readUInt16BE(51),
                    data.readUInt16BE(53),
                    data.readUInt16BE(55),
                ].filter((v) => v !== 0);
                const currentVoltage =
                    voltageArray.reduce((v1, v2) => v1 + v2, 0) /
                    voltageArray.length /
                    10;

                client.destroy();

                resolve({
                    inverterName,
                    currentPower,
                    currentVoltage,
                    dailyProduction,
                });
            });

            client.on("timeout", () => {
                client.destroy();
                reject(new Error("Connection timed out"));
            });

            client.on("error", (error) => {
                client.destroy();
                reject(error);
            });

            client.on("ready", () => {
                const requestBuffer = Buffer.alloc(20);
                requestBuffer.writeUIntBE(0x68024030, 0, 4);

                requestBuffer.writeUIntLE(this.wifiSn, 4, 4);
                requestBuffer.writeUIntLE(this.wifiSn, 8, 4);

                const checksum =
                    115 +
                    requestBuffer.subarray(4, 12).reduce((a, b) => a + b, 0);

                requestBuffer.writeUIntLE(0x01, 12, 2);
                requestBuffer.writeUIntLE(checksum, 14, 2);
                requestBuffer.writeUIntLE(0x16, 15, 1);

                client.write(requestBuffer);
            });
        });
    }
}

module.exports = { OmnikLocalApi };
