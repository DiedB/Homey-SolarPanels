// Copyright 2019: Rob, https://github.com/pro-sumer
// License: GNU GPLv3, https://www.gnu.org/licenses/gpl.txt

'use strict'

const fetch = require('node-fetch')
const md5 = require('md5')

const baseURL = 'https://server-api.growatt.com'
const loginURL = `${baseURL}/newTwoLoginAPI.do`
const plantURL = `${baseURL}/newTwoPlantAPI.do`

class GrowattAPI {
    constructor (username, password) {
        this.username = username
        this.password = md5(password).replace(/(.{2})/g, '_$1').replace(/_0(.)/g, '_c$1').replace(/_/g, '')
        this.cookies = undefined
        this.plants = undefined
    }

    async login () {
        this.cookies = undefined
        const body = `userName=${this.username}&password=${this.password}`
        const error = 'Could not login to Growatt server'
        const response = await this.request('POST', loginURL, body, error)
        if (response.body.back.success) {
            this.cookies = response.headers.raw()['set-cookie'].map(directive => directive.split(';')[0]).join(';')
            this.plants = response.body.back.data
        } else {
            throw new Error(error)
        }
    }

    async getDeviceList (plantId) {
        const error = `Could not get device list for plant ${plantId} from Growatt server`
        const url = `${plantURL}?op=getAllDeviceList&plantId=${plantId}`
        const response = await this.request('GET', url, null, error)
        return response.body.deviceList
    }

    async getInverterSerialNumbers () {
        await this.login()
        let serialNumbers = []
        for (let plant of this.plants) {
            const deviceList = await this.getDeviceList(plant.plantId)
            const inverters = deviceList.filter(device => ["inverter", "tlx"].includes(device.deviceType))
            serialNumbers.push(...inverters.map(device => device.deviceSn))
        }
        return serialNumbers
    }

    async getInverterProductionData (serialNumber) {
        await this.login()
        for (let plant of this.plants) {
            const deviceList = await this.getDeviceList(plant.plantId)
            const device = deviceList.find(device => device.deviceSn == serialNumber)
            if (device) {
                return { currentPower: Number(device.power), energyToday: Number(device.eToday) }                
            }
        }
        return undefined
    }

    async request (method, url, body, error) {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'ShinePhone/7.1.0 (iPhone; iOS 16.1.1; Scale/3.00)',
                Cookie: this.cookies
            },
            body: body
        })
        if (response.ok) {
            const data = await response.json()
            return { headers: response.headers, body: data }
        } else {
            throw new Error(error)
        }
    }
}

module.exports = { GrowattAPI }
