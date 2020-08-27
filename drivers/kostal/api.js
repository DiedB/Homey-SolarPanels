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
        settings: "/info/settings"
    }

    constructor(ipAddress, password, logFunc) {
        this.baseUrl = `http://${ipAddress}/api/v1`;
        this.password = password;
        this.log = logFunc;
    }

    async createPbkdf2Hash(message, salt, rounds) {
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(message, salt, rounds, 32, 'sha256', async (err, pbkdf2Hash) => {
                if (err) reject(err);
                resolve(pbkdf2Hash);
            });
        })
    }

    createNonce(nonceLength) {
        const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let nonce = "";
        for (let i = 0; i < nonceLength; i++) {
            nonce += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        return nonce;
    }

    // TODO: Raise on login error
    async login() {
        const userType = "user"
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

        const authStartJson = await authStartResponse.json();

        this.log(authStartJson)

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

        this.log(authFinishJson)

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

        this.log(authCreateSessionJson)

        this.session = authCreateSessionJson.sessionId;
    }

    async getInfo() {
        const getInfoResponse = await fetch(`${this.baseUrl}${this.endpoints.info}`, {
            headers: {
                "Content-Type": "application/json",
                "authorization": `Session ${this.session}`
            }
        });

        if (getInfoResponse.ok) {
            return await getInfoResponse.json();
        }
    }

    async getProcessData(moduleid, processdataid) {
        const processDataResponse = await fetch(`${this.baseUrl}${this.endpoints.processData}`, {
            method: "POST",
            body: JSON.stringify([{
                moduleid,
                processdataids: [processdataid]
            }]),
            headers: {
                "Content-Type": "application/json",
                "authorization": `Session ${this.session}`
            }
        });

        if (processDataResponse.ok) {
            const processDataJson = await processDataResponse.json();
            
            if (!processDataJson.message) {
                return processDataJson[0].processdata[0].value;
            } else {
                throw processDataJson.message;
            }
        }
    }

    async getSettings(moduleid, settingid) {
        const settingsResponse = await fetch(`${this.baseUrl}${this.endpoints.processData}`, {
            method: "POST",
            body: JSON.stringify([{
                moduleid,
                settingids: [settingid]
            }]),
            headers: {
                "Content-Type": "application/json",
                "authorization": `Session ${this.session}`
            }
        });

        if (settingsResponse.ok) {
            const settingsJson = await settingsResponse.json();
            
            if (!settingsJson.message) {
                return settingsJson[0].settings[0].value;
            } else {
                throw settingsJson.message;
            }
        }
    }

    getInverterSerialNumber = () => this.getSettings("devices:local", "Properties:SerialNo");

    getPowerData = () => this.getProcessData("devices:local", "Dc_P");

    getProductionData = () => this.getProcessData("scb:statistic:EnergyFlow", "Statistic:Yield:Day");
}

module.exports = { KostalApi };