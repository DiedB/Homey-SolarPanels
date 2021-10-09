"use strict";

const Homey = require("homey");
const fetch = require("node-fetch");
const uuid = require("uuid/v4");

const pathName = "/info.php";

class ESolarWifiModule extends Homey.Driver {
    onPair(socket) {
        socket.on("validate", (device, callback) => {
            const validationUrl = `http://${device.settings.ip}${pathName}`;

            fetch(validationUrl)
                .then((result) => {
                    if (result.ok || result.status === 304) {
                        return result.text();
                    } else {
                        callback(new Error(Homey.__("ip_error")));
                    }
                })
                .then((response) => {
                    // Return a unique ID to the pairing view
                    const [inverterId] = response.split(",");
                    callback(null, { id: inverterId });
                })
                .catch((error) => {
                    callback(new Error(Homey.__("ip_error")));
                });
        });
    }
}

module.exports = ESolarWifiModule;
