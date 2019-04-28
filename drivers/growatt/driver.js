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
      username = data.username
      password = data.password
      try {
        const loginResponse = await api.login(username, password)
        const loginData = await loginResponse.json()
        if (loginData.back.success) {
          for (let inverter of loginData.back.data) {
            devices.push({
              name: inverter.plantName,
              data: { id: inverter.plantId },
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
