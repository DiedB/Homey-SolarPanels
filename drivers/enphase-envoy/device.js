'use strict';

const Inverter = require('../../inverter');
const { EnphaseEnvoyApi } = require('./api');

class EnphaseEnvoy extends Inverter {
    onDiscoveryResult(discoveryResult) {
        // Return a truthy value here if the discovery result matches your device.
        return discoveryResult.id === this.getData().id;
    }

    async onDiscoveryAvailable(discoveryResult) {
        // This method will be executed once when the device has been found (onDiscoveryResult returned true)
        this.enphaseApi = new EnphaseEnvoyApi(`${discoveryResult.address}:${discoveryResult.port}`);

        await this.enphaseApi.getProductionData(); // When this throws, the device will become unavailable.
    }

    onDiscoveryAddressChanged(discoveryResult) {
        // Update your connection details here, reconnect when the device is offline
        this.enphaseApi = new EnphaseEnvoyApi(`${discoveryResult.address}:${discoveryResult.port}`);
    }

    onDiscoveryLastSeenChanged(_) {
        // When the device is offline, try to reconnect here
        this.setAvailable();
    }

    getCronString() {
        return '*/5 * * * * *';
    }

    async checkProduction() {
        this.log('Checking production');

        if (this.enphaseApi) {
            try {
                const productionData = await this.enphaseApi.getProductionData();

                const isMetered = productionData.production[1] && productionData.production[1].activeCount > 0;
                const hasConsumption = productionData.consumption && productionData.consumption[0].activeCount > 0;

                let currentProductionEnergy;
                let currentProductionPower;
                if (isMetered) {
                    currentProductionEnergy = productionData.production[1].whToday;
                    currentProductionPower = productionData.production[1].wNow;
                } else {
                    const enphaseEnergyMeterDate = this.getStoreValue('enphaseEnergyMeterDate');

                    if (enphaseEnergyMeterDate && enphaseEnergyMeterDate === new Date().toDateString()) {
                        currentProductionEnergy = (productionData.production[0].whLifetime - this.getStoreValue('enphaseEnergyMeter')) / 1000;
                    } else {
                        this.setStoreValue('enphaseEnergyMeterDate', new Date().toDateString());
                        this.setStoreValue('enphaseEnergyMeter', productionData.production[0].whLifetime);

                        currentProductionEnergy = 0;
                    }

                    currentProductionPower = productionData.production[0].wNow;
                }

                if (currentProductionEnergy !== null) {
                    this.setCapabilityValue('meter_power', currentProductionEnergy);
                    this.log(`Current production energy is ${currentProductionEnergy}kWh`);
                }

                this.setCapabilityValue('measure_power', currentProductionPower);    
                this.log(`Current production power is ${currentProductionPower}W`);
    
                if (hasConsumption) {
                    const currentConsumptionPower = productionData.consumption[0].wNow;
                    const currentConsumptionEnergy = productionData.consumption[0].whToday;

                    this.setCapabilityValue('consumption', currentConsumptionPower);
                    this.setCapabilityValue('daily_consumption', currentConsumptionEnergy);

                    this.log(`Current consumption power is ${currentConsumptionPower}W`);
                    this.log(`Current consumption energy is ${currentConsumptionEnergy}W`);
                }

                if (!this.getAvailable()) {
                    await this.setAvailable();
                }
    
            } catch (error) {
                this.log(`Unavailable (${error})`);
                this.setUnavailable(`Error retrieving data (${error})`);
            }    
        }
    }
}

module.exports = EnphaseEnvoy;