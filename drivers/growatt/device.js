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
            const productionResponse = await api.getProduction()
            const productionData = await productionResponse.json()
            if (productionData.plantNumber === 1) {
                if (!this.getAvailable()) {
                    this.setAvailable().then(result => {
                        this.log('Available')
                    }).catch(_ => {
                        this.error('Setting availability failed')
                    })
                }
                const currentEnergy = Number(productionData.todayValue)
                this.setCapabilityValue('daily_production', currentEnergy)
                const currentPower = Number(productionData.powerValue)
                this.setCapabilityValue('production', currentPower)
                this.log(`Current energy is ${currentEnergy}kWh`)
                this.log(`Current power is ${currentPower}W`)
            } else {
                throw new Error('Invalid Growatt API response')
            }
        } catch (error) {
            this.log(`Unavailable (${error})`)
            this.setUnavailable(`Error retrieving data (${error})`)
        }
    }
}

module.exports = Growatt
