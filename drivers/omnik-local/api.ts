import { InverterData } from "./types";

const net = require("net");

export class TimeoutError extends Error {
  constructor() {
    super("The connection timed out");
  }
}

export class UnexpectedResponseError extends Error {
  constructor(response: string) {
    super("Unexpected response from inverter: " + response);
  }
}

export class OmnikLocalApi {
  private readonly address: string;
  private readonly wifiSn: number;

  constructor({ address, wifiSn }: { address: string, wifiSn: number }) {
    this.address = address;
    this.wifiSn = wifiSn;
  }

  getData(): Promise<InverterData> {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      client.connect(8899, this.address);
      client.setTimeout(10000);

      client.on("data", (data: Buffer) => {
        if (Buffer.byteLength(data) > 70) {
          const inverterName = data.subarray(15, 31).toString();
          const powerArray = [
            data.readInt16BE(59),
            data.readInt16BE(63),
            data.readInt16BE(67)
          ].filter((v) => v > 0);

          const currentPower =
            powerArray.reduce((p1, p2) => p1 + p2, 0) /
            powerArray.length;
          const dailyProduction = data.readUInt16BE(69) / 100;
          const voltageArray = [
            data.readInt16BE(51),
            data.readInt16BE(53),
            data.readInt16BE(55)
          ].filter((v) => v > 0);
          const currentVoltage =
            voltageArray.reduce((v1, v2) => v1 + v2, 0) /
            voltageArray.length /
            10;
          const currentTemperature = data.readInt16BE(31) / 10;

          client.destroy();

          const typedResponse: InverterData = {
            inverterName,
            currentPower,
            currentVoltage,
            dailyProduction,
            currentTemperature
          };

          resolve(typedResponse);
        } else {
          reject(new UnexpectedResponseError(data.toString("hex")));
        }
      });

      client.on("timeout", () => {
        client.destroy();
        reject(new TimeoutError());
      });

      client.on("error", (error: any) => {
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

export default OmnikLocalApi;