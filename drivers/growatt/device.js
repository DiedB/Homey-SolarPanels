// Copyright 2019: Rob, https://github.com/pro-sumer
// License: GNU GPLv3, https://www.gnu.org/licenses/gpl.txt

'use strict'

const Inverter = require('../inverter')
const { GrowattAPI } = require('./api')

class Growatt extends Inverter {
    async onInit () {
        super.onInit()
        const settings = this.getSettings()
        this.api = new GrowattAPI(settings.username, settings.password)
        await this.api.login()
    }

    async onSettings (_, newSettings) {
        const api = new GrowattAPI(newSettings.username, newSettings.password)
        await api.login()
        this.api = api
    }

    async checkProduction () {
        this.log('Checking production')
        const data = this.getData()
        try {
            const production = await this.api.getInverterProductionData(data.id)
            const energyToday = production.energyToday
            const currentPower = production.currentPower
            this.setCapabilityValue('meter_power', energyToday)
            this.setCapabilityValue('measure_power', currentPower)
            if (!this.getAvailable()) {
                await this.setAvailable()
            }
            this.log(`Energy produced today is ${energyToday} kWh`)
            this.log(`Current power is ${currentPower} W`)
        } catch (error) {
            this.log(`Unavailable (${error})`)
            this.setUnavailable(`Error retrieving data (${error})`)
        }
    }
}

module.exports = Growatt
