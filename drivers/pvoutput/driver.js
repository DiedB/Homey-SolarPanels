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
    
        var sid     = data.sid;
        var key     = data.key;

        var url     = 'http://pvoutput.org/service/r2/getstatus.jsp?key=' + key + '&sid=' + sid;

        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
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
}

function initDevice(data) {

    devices[data.id] = {
            name       : data.name,
            sid        : data.sid,
            key        : data.key,
            last_output: '0:00',
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

    var url = 'http://pvoutput.org/service/r2/getstatus.jsp?key=' + data.key + '&sid=' + data.id;

    request(url, function(error, response, body) {

        if (!error && response.statusCode == 200) {
            var parsedResponse = body.split(',');
            var lastOutputTime = parsedResponse[1];

            if (lastOutputTime != device_data.last_output) {
                Homey.log('Parsing response!');

                device_data.last_output = lastOutputTime;

                var currentEnergy = Number(parsedResponse[2]);
                var currentPower = Number(parsedResponse[3]);
                var date = new Date();

                Homey.manager('insights').createEntry('energy_' + data.id, currentEnergy, date, function(err, success) {});
                Homey.manager('insights').createEntry('power_' + data.id, currentPower, date, function(err, success) {});
            } else {
                Homey.log('No new data for ' + data.name);
            }
        } else {
            Homey.log(error);
        }

    })
}
