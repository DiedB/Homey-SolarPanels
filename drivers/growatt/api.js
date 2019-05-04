// Copyright 2019: Rob, https://github.com/pro-sumer
// License: GNU GPLv3, https://www.gnu.org/licenses/gpl.txt

'use strict'

const fetch = require('node-fetch')
const md5 = require('md5')

const baseURL = 'https://server.growatt.com'
const loginURL = `${baseURL}/LoginAPI.do`
const plantListURL = `${baseURL}/PlantListAPI.do`

class GrowattAPI {
    constructor (username, password) {
        this.username = username
        this.password = md5(password).replace(/0(.)/g, 'c$1')
        this.cookies = undefined
    }

    async login () {
        this.cookies = undefined
        const credentials = `userName=${this.username}&password=${this.password}`
        const response = await this.request('POST', loginURL, credentials, 'Growatt server login failed')
        this.cookies = response.headers.getAll('Set-Cookie').map(directive => directive.split(';')[0]).join(';')
    }

    async request (method, url, body, error) {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: this.cookies },
            body: body
        })
        const data = await response.json()
        if (data.back.success) {
            return { headers: response.headers, body: data.back }
        } else {
            throw new Error(error)
        }
    }

    async getPlantList () {
        await this.login()
        const response = await this.request('GET', plantListURL, null, 'Could not get plant list from Growatt server')
        return response.body
    }
}

module.exports = { GrowattAPI }
