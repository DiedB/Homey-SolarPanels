// Copyright 2019: Rob, https://github.com/pro-sumer
// License: GNU GPLv3, https://www.gnu.org/licenses/gpl.txt

'use strict'

const fetch = require('node-fetch')
const md5 = require('md5')

const baseURL = 'https://server.growatt.com'
const loginURL = `${baseURL}/newLoginAPI.do`
const plantURL = `${baseURL}/newPlantAPI.do`
const inverterURL = `${baseURL}/newInverterAPI.do`

class GrowattAPI {
    constructor (username, password) {
        this.username = username
        this.password = md5(password).replace(/0(.)/g, 'c$1')
        this.cookies = undefined
        this.plants = undefined
    }

    async login () {
        this.cookies = undefined
        const body = `userName=${this.username}&password=${this.password}`
        const error = 'Could not login to Growatt server'
        const response = await this.request('POST', loginURL, body, error)
        if (response.body.back.success) {
            this.cookies = response.headers.getAll('Set-Cookie').map(directive => directive.split(';')[0]).join(';')
            this.plants = response.body.back.data
        } else {
            throw new Error(error)
        }
    }

    async getInverterSerialNumbers () {
        await this.login()
        const error = 'Could not get inverters from Growatt server'
        var serialNumbers = []
        for (let plant of this.plants) {
            const url = `${plantURL}?op=getAllDeviceListThree&pageNum=1&pageSize=15&plantId=${plant.plantId}`
            const response = await this.request('GET', url, null, error)
            for (let inverter of response.body.deviceList) {
                serialNumbers.push(inverter.deviceSn)
            }
        }
        return serialNumbers
    }

    async getInverterProductionData (serialNumber) {
        await this.login()
        const today = new Date().toISOString().split('T')[0]
        const url = `${inverterURL}?op=getInverterData&type=1&date=${today}&id=${serialNumber}`
        const error = 'Could not get production data from Growatt server'
        const response = await this.request('GET', url, null, error)
        const data = { currentPower: Number(response.body.power), energyToday: Number(response.body.eToday) }
        return data
    }

    async request (method, url, body, error) {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: this.cookies },
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
