var request = require('request');

var devices = {};

module.exports.init = function(devices_data, callback) {
    Homey.log(devices_data);
    devices_data.forEach(initDevice);
    callback(null, true); 
};

module.exports.pair = function(socket) {
    // Validate PVOutput data
    socket.on('validate', function( data, callback ){
        Homey.log('Validating', data);

        var url     = 'https://api.enphaseenergy.com/api/v2/systems/' + data.sid + '/summary?key=' + data.key + '&user_id=' + data.uid;

        request(url, function (error, response, body) {
            if (!error && (response.statusCode == 200 || response.statusCode == 304)) {
                Homey.log('Pairing successful!');
                callback(null, true);
            } else {
                Homey.log('Error during pairing');
                callback(body, null);
            }
        })
    })
    
    socket.on('add_device', function( device_data, callback ){
        initDevice(device_data);
        callback(null, true);
    });
};

module.exports.deleted = function(device_data, callback) {
    Homey.log('Deleting ' + device_data.id);

    Homey.manager('insights').deleteLog('energy_' + device_data.id, function(err, success) {});
    Homey.manager('insights').deleteLog('power_' + device_data.id, function(err, success) {});

    Homey.manager('cron').unregisterTask('solar_' + device_data.id, function(err, success) {});

    delete devices[device_data.id];
};

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
            data       : data
    }
    
    // Create logs
    Homey.manager('insights').createLog('energy_' + data.id, {
        label: { en: data.name + ' - Energy (daily)' },
        type: 'number',
        units: { en: 'Wh' },
        decimals: 2
    }, function callback(err , success){});

    Homey.manager('insights').createLog('power_' + data.id, {
        label: { en: data.name + ' - Power' },
        type: 'number',
        units: { en: 'W' },
        decimals: 2
    }, function callback(err , success){});

    Homey.log('Instantiated logs for ' + data.name + '!')

    // Create cron job for production check
    var taskName = 'solar_' + data.id;
    Homey.manager('cron').unregisterTask(taskName, function(err, success) {
        Homey.manager('cron').registerTask(taskName, '* * * * *', data, function(err, task) {})
    });

    Homey.manager('cron').on(taskName, function(data_cron) {
        Homey.log('Checking production for ' + data_cron.name);
        checkProduction(data_cron);
    })

}

function checkProduction(data) {
    var device_data = devices[data.id]

    var url     = 'https://api.enphaseenergy.com/api/v2/systems/' + data.id + '/summary?key=' + data.key + '&user_id=' + data.uid;

    request(url, function(error, response, body) {

        if (!error && (response.statusCode == 200 || response.statusCode == 304)) {
            var parsedResponse = JSON.parse(body);
            var lastOutputTime = Number(parsedResponse.last_report_at);

            if (lastOutputTime != device_data.last_output) {
                Homey.log('Parsing response!');

                device_data.last_output = lastOutputTime;

                var currentEnergy = Number(parsedResponse.energy_today);
                device_data.last_energy = currentEnergy / 1000;
                var currentPower = Number(parsedResponse.current_power);
                device_data.last_power = currentPower;
                var date = new Date();

                Homey.manager('insights').createEntry('energy_' + data.id, currentEnergy, date, function(err, success) {});
                Homey.manager('insights').createEntry('power_' + data.id, currentPower, date, function(err, success) {});
            } else {
                Homey.log('No new data for ' + data.name);
            }
        } else {
            Homey.log('Status code: ' + response.statusCode);
            // module.exports.setUnavailable( device_data.data, "Offline");
        }
    })
}
