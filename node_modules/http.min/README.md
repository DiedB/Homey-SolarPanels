# Minimal HTTP client library
[![NPM][npm-image]][npm-url] [![Build status][travis-image]][travis-url] [![Coverage Status][coverage-image]][coverage-url] [![js-standard-style][standard-image]][standard-url] [![Dependencies][david-image]][david-url] [![devDependencies][david-dev-image]][david-dev-url]

Minimal simple HTTP client with promises.  
Supports HTTP, HTTPS and common methods GET, POST, PUT, PATCH, DELETE.  
Includes timeout, query string, form data, JSON helpers.  
No dependencies, under 100 SLOC.

## Install

    npm install --save http.min

## Examples

### GET
```javascript
var http = require('http.min')
http('https://httpbin.org/get').then(function (result) {
  console.log('Code: ' + result.response.statusCode)
  console.log('Response: ' + result.data)
})
```

### POST

#### JSON
```javascript
var http = require('http.min')
http.post('https://httpbin.org/post', {data: 'hello'}).then(function (result) {
  console.log('Code: ' + result.response.statusCode)
  console.log('Response: ' + result.data)
})
```

#### Form urlencoded
`data` parameter is a string.

```javascript
var http = require('http.min')
http.post('https://httpbin.org/post', 'data=hello').then(function (result) {
  console.log('Code: ' + result.response.statusCode)
  console.log('Response: ' + result.data)
})
```

### JSON
```javascript
var http = require('http.min')
http.json('https://httpbin.org/get').then(function (data) {
  console.log('Response:', data.url)
})
```

### Advanced

#### Functions also accept [http.request options object][node-http-options].

```javascript
var http = require('http.min')
var options = {
  protocol: 'https:',
  hostname: 'httpbin.org',
  path: '/get',
  headers: {
    'User-Agent': 'Node.js http.min'
  }
}
http.json(options).then(function (data) {
  console.log('Response:', data)
})
```

#### Helpers

```javascript
var http = require('http.min')
var options = {
  uri: 'https://httpbin.org/post',
  // timeout in ms
  timeout: 1000,
  // query string helper
  query: {
    hello: 'test'
  },
  // form urlencoded
  form: {
    test: 'ok'
  },
  // handle JSON data
  json: true
  // send JSON data and expect JSON response
  json: {
    this: 'is data'
  },
  request: function (req) {
    // hook to manipulate request before being sent
    // instace of node http.ClientRequest
    req.setTimeout(2000)
    req.on('upgrade', ...)
  }
}
http.post(options).then(function (result) {
  console.log('Code: ' + result.response.statusCode)
  console.log('Response:', result.data)
})
```

## License
ISC

[npm-image]: https://img.shields.io/npm/v/http.min.svg
[npm-url]: https://www.npmjs.com/package/http.min
[travis-image]: https://img.shields.io/travis/matjaz/node-http.min/master.svg?style=flat
[travis-url]: https://travis-ci.org/matjaz/node-http.min
[coverage-image]: https://img.shields.io/coveralls/matjaz/node-http.min/master.svg?style=flat
[coverage-url]: https://coveralls.io/r/matjaz/node-http.min
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[standard-url]: http://standardjs.com
[david-image]: https://img.shields.io/david/matjaz/node-http.min.svg?style=flat
[david-url]: https://david-dm.org/matjaz/node-http.min
[david-dev-image]: https://img.shields.io/david/dev/matjaz/node-http.min.svg?style=flat
[david-dev-url]: https://david-dm.org/matjaz/node-http.min#info=devDependencies
[node-http-options]: https://nodejs.org/api/http.html#http_http_request_options_callback
