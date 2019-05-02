// Copyright 2019: Rob, https://github.com/pro-sumer
// License: GNU GPLv3, https://www.gnu.org/licenses/gpl.txt

'use strict'

const Inverter = require('../inverter')
const api = require('./api')

class Growatt extends Inverter {
    async checkProduction () {
        try {
            const settings = this.getSettings()
            await api.login(settings.username, settings.password)
            const plantListResponse = await api.getPlantList()
            const plantList = await plantListResponse.json()
            const data = this.getData()
            const plantData = plantList.back.data.find(plant => plant.plantId === data.id)
            if (plantData) {
                if (!this.getAvailable()) {
                    await this.setAvailable()
                }
                const todayEnergy = this.value(plantData.todayEnergy)
                this.setCapabilityValue('daily_production', todayEnergy)
                const currentPower = this.value(plantData.currentPower)
                this.setCapabilityValue('production', currentPower)
                this.log(`Current energy is ${todayEnergy} kWh`)
                this.log(`Current power is ${currentPower} W`)
            } else {
                throw new Error('Invalid Growatt API response')
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
