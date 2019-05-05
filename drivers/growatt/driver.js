// Copyright 2019: Rob, https://github.com/pro-sumer
// License: GNU GPLv3, https://www.gnu.org/licenses/gpl.txt

'use strict'

const Homey = require('homey')
const { GrowattAPI } = require('./api')

class Growatt extends Homey.Driver {
    onPair (socket) {
        let username
        let password
        let api

        socket.on('login', async (credentials, callback) => {
            username = credentials.username
            password = credentials.password
            try {
                api = new GrowattAPI(username, password)
                await api.login()
                callback(null, true)
            } catch (error) {
                this.error(error)
                callback(error)
            }
        })

        socket.on('list_devices', async (_, callback) => {
            try {
                const serialNumbers = await api.getInverterSerialNumbers()
                const devices = serialNumbers.map(serialNumber => ({
                    name: serialNumber,
                    data: { id: serialNumber },
                    settings: { username, password }
                }))
                callback(null, devices)
            } catch (error) {
                this.error(error)
                callback(error)
            }
        })
    }
}

module.exports = Growatt
