"use strict";

var http = require("http.min");
var parseXML = require("xml2js").parseString;
var md5 = require("md5");

var base_url = "http://www.solarmanpv.com:10000/serverapi/";
var devices = {};

module.exports.init = function (devices_data, callback) {
    devices_data.forEach(function (device_data) {
        initDevice(device_data, false);
    });

    callback(null, true);
};

module.exports.pair = function (socket) {
    socket.on("validate", function (data, callback){
        var hashed_password = md5(data.password);
        var login_url = base_url + "?method=Login&username=" + data.username + "&password=" + hashed_password + "&key=apitest";

        http.get(login_url).then(function (result) {
            parseXML(result.data, function (err, result) {
                if (!result.error) {
                    var data_url = base_url + "?method=Data&username=" + data.username + "&stationid=" + data.id + "&token=" + result.login.token[0] + "&key=apitest";

                    http.get(data_url).then(function (result) {
                        parseXML(result.data, function (err, result) {
                            if (!result.error) {
                                callback(null, true);
                            } else {
                                callback(__("plant_error"), null);
                            }
                        });
                    });
                } else {
                    callback(__("login_error"), null);
                }
            });
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
        last_update: 0,
        last_token: "",
        power: 0,
        energy: 0
    };

    getToken(device_data);

    if (cron) {
        Homey.manager("cron").registerTask(device.cron_name, "*/5 * * * *", device_data, function (err, task) {
            if (err !== null) {
                Homey.log("[" + device.name + "] Error while creating cron job: " + err);
            }
        });
    }

    Homey.manager("cron").on(device.cron_name, function (device_data) {
        checkProduction(device_data);
    });
}

function checkProduction(device_data) {
    var device = devices[device_data.id];
    var url = base_url + "?method=Data&username=" + device_data.username + "&stationid=" + device_data.id + "&token=" + device.last_token + "&key=apitest";

    http.get(url).then(function (result) {
        parseXML(result.data, function (err, result) {
            if (!result.error) {
                module.exports.setAvailable(device_data);

                var last_update = Number(result.data.detail[0].lastupdated[0]);
                if (last_update != device.last_update) {
                    device.last_update = last_update;

                    var energy = Number(result.data.detail[0].WiFi[0].inverter[0].etoday[0]);
                    device.energy = energy;
                    module.exports.realtime(device_data, "meter_power", energy);

                    var power = Number(result.data.detail[0].WiFi[0].inverter[0].power[0]) * 1000;
                    device.power = power;
                    module.exports.realtime(device_data, "measure_power", power);

                    Homey.log("[" + device_data.name + "] Energy: " + energy + "kWh");
                    Homey.log("[" + device_data.name + "] Power: " + power + "W");
                } else {
                    Homey.log("[" + device_data.name + "] No new data");
                }
            } else {
                getToken(device_data);
            }
        });
    });
}

function getToken(device_data) {
    var device = devices[device_data.id];
    var hashed_password = md5(device_data.password);
    var url = base_url + "?method=Login&username=" + device_data.username + "&password=" + hashed_password + "&key=apitest";

    http.get(url).then(function (result) {
        parseXML(result.data, function (err, result) {
            if (!result.error) {
                Homey.log("[" + device_data.name + "] Retrieved new token");
                device.last_token = result.login.token[0];
                return true;
            } else {
                Homey.log("[" + device_data.name + "] Could not retrieve new token");
                module.exports.setUnavailable(device_data.data, "Authentication error");
                return false;
            }
        });
    });
}
