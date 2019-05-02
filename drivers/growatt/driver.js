// Copyright 2019: Rob, https://github.com/pro-sumer
// License: GNU GPLv3, https://www.gnu.org/licenses/gpl.txt

'use strict'

const Homey = require('homey')
const api = require('./api')

class Growatt extends Homey.Driver {
    onPair (socket) {
        let username
        let password
        let devices = []

        socket.on('login', async (data, callback) => {
            const { username, password } = data
            try {
                const loginResponse = await api.login(username, password)
                const login = await loginResponse.json()
                const plantListResponse = await api.getPlantList()
                const plantList = await plantListResponse.json()
                if (login.back.success) {
                    for (let plant of plantList.back.data) {
                        devices.push({
                            name: plant.plantName || plant.plantId.toString(),
                            data: { id: plant.plantId },
                            settings: { username, password }
                        })
                    }
                    callback(null, true)
                } else {
                    callback(new Error(Homey.__('login_error')))
                }
            } catch (error) {
                callback(new Error(Homey.__('network_error')))
            }
        })

        socket.on('list_devices', (data, callback) => {
            callback(null, devices)
        })
    }
}

module.exports = Growatt
