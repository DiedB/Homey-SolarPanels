const fetch = require('node-fetch');
const crypto = require('crypto');

class KostalApi {
    // Define API endpoints
    endpoints = {
        authStart: "/auth/start",
        authFinish: "/auth/finish",
        authCreateSession: "/auth/create_session",
        processData: "/processdata",
        info: "/info/version",
        settings: "/settings"
    }

    constructor(ipAddress, password, log) {
        this.baseUrl = `http://${ipAddress}/api/v1`;
        this.password = password;
        this.log = log;
        this.failedLoginCount = 0;
    }

    async createPbkdf2Hash(message, salt, rounds) {
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(message, salt, rounds, 32, 'sha256', async (err, pbkdf2Hash) => {
                if (err) reject(err);
                resolve(pbkdf2Hash);
            });
        })
    }
    
    hasValidSession() {
        return Boolean(this.session);
    }

    createNonce(nonceLength) {
        const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let nonce = "";
        for (let i = 0; i < nonceLength; i++) {
            nonce += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        return nonce;
    }

    async login() {
        if (this.failedLoginCount > 2) {
            // Prevent account lockout
            this.log("Authentication attempt limit reached");
            throw "Too many failed login attempts, please update your password in settings";
        }

        const userType = "user";
        const nonce = Buffer.from(this.createNonce(12)).toString('base64');

        // Authentication step 1
        const authStartResponse = await fetch(`${this.baseUrl}${this.endpoints.authStart}`, {
            method: "POST",
            body: JSON.stringify({
                username: userType,
                nonce
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!authStartResponse.ok) {
            throw "Inverter connection failed";
        }

        const authStartJson = await authStartResponse.json();

        const salt = Buffer.from(authStartJson.salt, "base64");

        const pbkdf2Hash = await this.createPbkdf2Hash(this.password, salt, authStartJson.rounds);

        const clientKey = crypto.createHmac('sha256', pbkdf2Hash).update("Client Key").digest();
        const serverKey = crypto.createHmac('sha256', pbkdf2Hash).update("Server Key").digest();

        const d = `n=${userType},r=${nonce},r=${authStartJson.nonce},s=${authStartJson.salt},i=${authStartJson.rounds},c=biws,r=${authStartJson.nonce}`;
        const hashedClientKey = crypto.createHash('sha256').update(clientKey).digest();
        const g = crypto.createHmac('sha256', hashedClientKey).update(d).digest();
        const p = crypto.createHmac('sha256', serverKey).update(d).digest();

        let proof = Buffer.alloc(clientKey.length)
        for (let i = 0; i < p.length; i++) {
            proof[i] = clientKey[i] ^ g[i];
        }
        proof = Buffer.from(proof).toString("base64");;

        // Authentication step 2
        const authFinishResponse = await fetch(`${this.baseUrl}${this.endpoints.authFinish}`, {
            method: "POST",
            body: JSON.stringify({
                transactionId: authStartJson.transactionId,
                proof
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });

        const authFinishJson = await authFinishResponse.json();

        if (!authFinishResponse.ok) {
            this.failedLoginCount += 1;

            throw "Invalid credentials";
        }

        const y = crypto.createHmac("sha256", hashedClientKey).update("Session Key");
        y.update(d);
        y.update(clientKey)
        const P = y.digest()
        
        const iv = crypto.randomBytes(16);
        const aesCipher = crypto.createCipheriv("aes-256-gcm", P, iv);
        const encrypted = Buffer.concat([aesCipher.update(authFinishJson.token, "utf8"), aesCipher.final()]);

        // Authentication step 3
        const authCreateSessionResponse = await fetch(`${this.baseUrl}${this.endpoints.authCreateSession}`, {
            method: "POST",
            body: JSON.stringify({
                transactionId: authStartJson.transactionId,
                iv: Buffer.from(iv).toString("base64"),
                tag: Buffer.from(aesCipher.getAuthTag()).toString("base64"),
                payload: Buffer.from(encrypted).toString("base64")
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });
        
        const authCreateSessionJson = await authCreateSessionResponse.json();

        if (!authCreateSessionResponse.ok && !authCreateSessionJson.sessionId) {
            throw "Session creation failed";
        }

        this.log("Kostal (re)login successful");

        this.session = authCreateSessionJson.sessionId;
    }

    async authenticatedApiRequest(url, method = "GET", body) {
        const requestOptions = {
            method,
            headers: {
                "Content-Type": "application/json",
                "authorization": `Session ${this.session}`
            }
        }

        if (body) {
            requestOptions.body = body;
        }

        const response = await fetch(url, requestOptions);

        // Detect session expiry
        if (response.status >= 400 && response.status < 500) {
            // Attempt re-login
            this.log("Session expired, logging back in")
            await this.login();
        } else if (response.ok) {
            const json = await response.json();

            if (!json.message) {
                return json;
            } else {
                throw json.message;
            }
        }

        throw "API request failed";
    }

    async getInfo() {
        return await this.authenticatedApiRequest(`${this.baseUrl}${this.endpoints.info}`);
    }

    async getProcessData(moduleid, processdataid) {
        const processDataJson = await this.authenticatedApiRequest(`${this.baseUrl}${this.endpoints.processData}`, "POST", JSON.stringify([{
            moduleid,
            processdataids: [processdataid]
        }]));

        return processDataJson[0].processdata[0].value;
    }

    async getSettings(moduleid, settingid) {
        const settingsJson = await this.authenticatedApiRequest(`${this.baseUrl}${this.endpoints.settings}`, "POST", JSON.stringify([{
            moduleid,
            settingids: [settingid]
        }]));
       
        return settingsJson[0].settings[0].value;
    }

    getInverterSerialNumber = () => this.getSettings("devices:local", "Properties:SerialNo");

    getPowerData = () => this.getProcessData("devices:local:ac", "P");

    getProductionData = () => this.getProcessData("scb:statistic:EnergyFlow", "Statistic:Yield:Day");
}

module.exports = { KostalApi };