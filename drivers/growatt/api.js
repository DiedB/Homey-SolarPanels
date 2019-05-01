// Copyright 2019: Rob, https://github.com/pro-sumer
// License: GNU GPLv3, https://www.gnu.org/licenses/gpl.txt

'use strict'

const fetch = require('node-fetch')
const md5 = require('md5')

const baseURL = 'https://server.growatt.com'
const loginURL = `${baseURL}/newLoginAPI.do`
const dataURL = `${baseURL}/newPlantAPI.do?action=getUserCenterEnertyData`

let cookies

function post (url, body) {
    return fetch(url, {
        method: 'POST',
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
    const response = await post(loginURL, `userName=${username}&password=${md5c(password)}`)
    cookies = getCookies(response)
    return response
}

exports.getProduction = function () {
    return post(dataURL, 'language=1')
}
