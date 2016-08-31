var http = require('http.min');
var parseXML = require('xml2js').parseString;
var md5 = require('md5');

var base_url = 'http://www.omnikportal.com:10000/serverapi/';

var devices = {};

module.exports.init = function(devices_data, callback) {
    Homey.log(devices_data);
    devices_data.forEach(initDevice);
    callback(null, true); 
};

module.exports.pair = function(socket) {
    // Validate Omnik Portal data
    socket.on('validate', function(data, callback){
        Homey.log('Validating', data);

        var hashed_password = md5(data.password)

        var login_url = base_url + '?method=Login&username=' + data.username + '&password=' + hashed_password + '&key=apitest';

        http.get(login_url).then(function (result) {
            parseXML(result.data, function (err, result) {
                if (!result.error) {
                    Homey.log('Pairing successful!');
                    callback(null, true);
                } else {
                    Homey.log('Error while pairing');
                    callback(result.error.errorMessage[0], null);
                }
            });
        })
    })
    
    socket.on('add_device', function( device_data, callback ){
        initDevice(device_data);
        callback(null, true);
    });
};

module.exports.deleted = function(device_data, callback) {
    Homey.log('Deleting ' + device_data.id);

    Homey.manager('cron').unregisterTask('solar_' + device_data.id, function(err, success) {});

    delete devices[device_data.id];
};

module.exports.renamed = function( device_data, new_name ) {
    devices[device_data.id].name = new_name;

    Homey.log(device_data.id + ' has been renamed to ' + new_name);
}

module.exports.capabilities = {
    measure_power: {
        get: function(device_data, callback) {
            var device = devices[device_data.id];

            callback(null, device.last_power);
        }
    },
    meter_power: {
        get: function(device_data, callback) {
            var device = devices[device_data.id];
            
            callback(null, device.last_energy);
        }
    }
};

function initDevice(data) {

    devices[data.id] = {
            name       : data.name,
            last_output: 0,
            last_power : 0,
            last_energy: 0,
            last_token : '0',
            data       : data
    }

    getToken(data);
    
    // Create cron job for production check
    var taskName = 'solar_' + data.id;
    Homey.manager('cron').unregisterTask(taskName, function(err, success) {
        Homey.manager('cron').registerTask(taskName, '*/5 * * * *', data, function(err, task) {})
    });

    Homey.manager('cron').on(taskName, function(data_cron) {
        Homey.log('Checking production for ' + data_cron.name);
        checkProduction(data_cron);
    })

}

function checkProduction(data) {
    var device_data = devices[data.id]

    var data_url = base_url + '?method=Data&username=' + data.username + '&stationid=' + data.id + '&token=' + device_data.last_token + '&key=apitest';

    http.get(data_url).then(function (result) {
        parseXML(result.data, function (err, result) {
            if (!result.error) {
                module.exports.setAvailable(device_data);

                var lastOutputTime = result.data.detail[0].lastupdated[0];

                if (lastOutputTime != device_data.last_output) {
                    Homey.log('Parsing response!');

                    device_data.last_output = lastOutputTime;

                    var currentEnergy = Number(result.data.detail[0].WiFi[0].inverter[0].etoday[0]);
                    device_data.last_energy = currentEnergy;
                    module.exports.realtime(data, "meter_power", currentEnergy);

                    var currentPower = Number(result.data.detail[0].WiFi[0].inverter[0].power[0] * 1000);
                    device_data.last_power = currentPower;
                    module.exports.realtime(data, "measure_power", currentPower);

                } else {
                    Homey.log('No new data for ' + data.name);
                }
            } else {
                if (getToken(data)) {
                    checkProduction(data);
                }
            }
        });
    });
}

function getToken(data) {
    var device_data = devices[data.id]

    var hashed_password = md5(data.password)

    var login_url = base_url + '?method=Login&username=' + data.username + '&password=' + hashed_password + '&key=apitest';

    http.get(login_url).then(function (result) {
        parseXML(result.data, function (err, result) {
            if (!result.error) {
                Homey.log('Retrieved new token successfully!');
                device_data.last_token = result.login.token[0];
                return true;
            } else {
                Homey.log('Error while retrieving new token');
                module.exports.setUnavailable(device_data.data, 'Received an error while logging in');
                return false;
            }
        });
    })
}
