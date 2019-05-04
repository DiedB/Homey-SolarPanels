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
            const plantList = await this.api.getPlantList()
            const plantData = plantList.data.find(plant => plant.plantId === data.id)
            if (plantData) {
                const todayEnergy = this.value(plantData.todayEnergy)
                const currentPower = this.value(plantData.currentPower)
                this.setCapabilityValue('daily_production', todayEnergy)
                this.setCapabilityValue('production', currentPower)
                if (!this.getAvailable()) {
                    await this.setAvailable()
                }
                this.log(`Energy produced today is ${todayEnergy} kWh`)
                this.log(`Current power is ${currentPower} W`)
            } else {
                throw new Error('Could not get production data from Growatt server')
            }
        } catch (error) {
            this.log(`Unavailable (${error})`)
            this.setUnavailable(`Error retrieving data (${error})`)
        }
    }

    value (string) {
        return Number(string.split(' ')[0])
    }
}

module.exports = Growatt
