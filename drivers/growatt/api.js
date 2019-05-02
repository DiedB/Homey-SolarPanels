// Copyright 2019: Rob, https://github.com/pro-sumer
// License: GNU GPLv3, https://www.gnu.org/licenses/gpl.txt

'use strict'

const fetch = require('node-fetch')
const md5 = require('md5')

const baseURL = 'https://server.growatt.com'
const loginURL = `${baseURL}/LoginAPI.do`
const plantListURL = `${baseURL}/PlantListAPI.do`

let cookies

function request (method, url, body = null) {
    return fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookies },
        body: body
    })
}

function getCookies (response) {
    return response.headers.getAll('Set-Cookie').map(directive => directive.split(';')[0]).join(';')
}

function md5c (message) {
    return md5(message).replace(/0(.)/g, 'c$1')
}

exports.login = async function (username, password) {
    cookies = undefined
    const response = await request('POST', loginURL, `userName=${username}&password=${md5c(password)}`)
    cookies = getCookies(response)
    return response
}

exports.getPlantList = function () {
    return request('GET', plantListURL)
}
