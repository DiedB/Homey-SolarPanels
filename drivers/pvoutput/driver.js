"use strict";

var http = require("http.min");

var base_url = "http://pvoutput.org/service/r2/getstatus.jsp";
var devices = {};

module.exports.init = function (devices_data, callback) {
    devices_data.forEach(function (device_data) {
        initDevice(device_data, false);
    });

    callback(null, true);
};

module.exports.pair = function (socket) {
    socket.on("validate", function (data, callback) {
        var url = base_url + "?key=" + data.key + "&sid=" + data.sid;

        http.get(url).then(function (result) {
            if (result.response.statusCode == 200 || result.response.statusCode == 304) {
                callback(null, true);
            } else {
                callback(__("login_error"), null);
            }
        });
    });
};

module.exports.added = function (device_data, callback) {
    Homey.log("[" + device_data.name + "] Added");

    initDevice(device_data, true);
    callback(null, true);
};

module.exports.deleted = function (device_data, callback) {
    Homey.log("[" + device_data.name + "] Deleted");

    Homey.manager("cron").unregisterTask(devices[device_data.id].cron_name, function (err, success) {});

    delete devices[device_data.id];
    callback(null, true);
};

module.exports.renamed = function (device_data, new_name) {
    Homey.log("[" + device_data.name + "] Renamed to: " + new_name);

    devices[device_data.id].name = new_name;
};

module.exports.capabilities = {
    measure_power: {
        get: function (device_data, callback) {
            var device = devices[device_data.id];

            if (device === undefined) {
                callback(null, 0);
            } else {
                callback(null, device.power);
            }
        }
    },
    meter_power: {
        get: function (device_data, callback) {
            var device = devices[device_data.id];

            if (device === undefined) {
                callback(null, 0);
            } else {
                callback(null, device.energy);
            }
        }
    }
};

function initDevice(device_data, cron) {
    Homey.log("[" + device_data.name + "] Initializing device");

    var device = devices[device_data.id] = {
        name: device_data.name,
        cron_name: "solar_" + device_data.id,
        last_output: "0:00",
        power: 0,
        energy: 0
    };

    if (cron) {
        Homey.manager("cron").registerTask(device.cron_name, "*/5 * * * *", device_data, function (err, task) {
            if (err === null) {
                Homey.manager("cron").on(device.cron_name, function (device_data) {
                    checkProduction(device_data);
                });
            } else {
                Homey.log("[" + device.name + "] Error while creating cron job: " + err);
            }
        });
    }
}

function checkProduction(device_data) {
    var device = devices[device_data.id];

    var url = base_url + "?key=" + device_data.key + "&sid=" + device_data.id;

    http.get(url).then(function (result) {
        if (result.response.statusCode == 200) {
            module.exports.setAvailable(device_data);

            var response = result.data.split(",");
            var last_output = response[1];

            if (last_output != device.last_output) {
                device.last_output = last_output;

                var energy = Number(response[2]) / 1000;
                device.energy = energy;
                module.exports.realtime(device_data, "meter_power", energy);

                var power = Number(response[3]);
                device.power = power;
                module.exports.realtime(device_data, "measure_power", power);

                Homey.log("[" + device_data.name + "] Energy: " + energy + "kWh");
                Homey.log("[" + device_data.name + "] Power: " + power + "W");
            } else {
                Homey.log("[" + device_data.name + "] No new data");
            }
        } else {
            Homey.log("[" + device_data.name + "] Unavailable: " + result.response.statusCode + " error");

            module.exports.setUnavailable(device_data, result.response.statusCode + " error");
        }
    });
}
