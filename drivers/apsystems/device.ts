import { Inverter } from "../../inverter";
import { apsystems } from 'apsystems';

class APsystemsECUR extends Inverter {
    interval = 2;

    async checkProduction(): Promise<void>  {
        this.homey.log("Checking production");

        const self = this;
        const settings: DeviceSettings = await this.getSettings();

        const ecur = new apsystems.ECUR(settings.ip, 8899);
        ecur.getECUdata(async (err: Error, result: Object) => {

            // Handle error
            if (err ) {
                self.homey.log(`Unavailable (${error})`);
                await self.setUnavailable(`Error retrieving data (${error})`);

                return;
            }

            // Verify availability
            if (!self.getAvailable())
                await self.setAvailable();

            // Set capabilities
            await self.setCapabilityValue('meter_power', result.today_energy);
            await self.setCapabilityValue('measure_power', result.current_power);

            self.homey.log(`Current energy is ${result.today_energy}kWh`);
            self.homey.log(`Current power is ${result.current_power}W`);
        });
    }
}

module.exports = APsystemsECUR;
