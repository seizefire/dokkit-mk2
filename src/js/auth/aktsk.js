const axios = require("../utils/axios");
const device = require("../utils/device");
const globals = require("../globals");

module.exports = {
	/**
	 * @param {"global"|"japan"} region 
	 * @param {"android"|"ios"} platform 
	 */
	async signup(region, platform){
		var dev = device.generateRandomDevice(region, platform)
		var body = device.convertDeviceToBody(dev);
		var headers = {
			'Accept': "*/*",
			'Content-Type': "application/json",
			'X-Platform': platform,
			'X-ClientVersion': globals.versions[region][platform],
			'X-Language': region == "global" ? "en" : "jp",
			'User-Agent': globals.agents[platform]
		};
		var response = await axios.post(globals.baseUrls[region] + "/auth/sign_up", JSON.stringify(body), {headers})
		if(response.data.identifier && response.data.user){
			let data = response.data;
			let id = region + data.user.id;
			let parts = Buffer.from(data.identifier.split("\n").join(), "base64").toString().split(":");
			let basic = Buffer.from(parts[1] + ":" + parts[0]);
			globals.database.prepare("INSERT INTO accounts VALUES (?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, data.user.id, data.user.name, dev.region, basic, dev.platform, dev.brand, dev.model, dev.version, dev.ad_id, dev.unique_id);
			return id;
		}else if(response.data.reason == "Require Captcha"){
			return {
				captcha: {
					url: response.data.captcha_url,
					done: async function(){
						body.captcha_session_key = response.data.captcha_session_key;
						body.user_account.country = region == "global" ? "US" : "JP";
						body.user_account.currency = region == "global" ? "USD" : "JPY";
						response = await axios.post(globals.baseUrls[region] + "/auth/sign_up", JSON.stringify(body), {headers});
						if(response.data.captcha_result == "success"){
							let data = response.data;
							let id = region + data.user.id;
							let parts = Buffer.from(data.identifier.split("\n").join(), "base64").toString().split(":");
							let basic = Buffer.from(parts[1] + ":" + parts[0]);
							globals.database.prepare("INSERT INTO accounts VALUES (?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, data.user.id, data.user.name, dev.region, basic, dev.platform, dev.brand, dev.model, dev.version, dev.ad_id, dev.unique_id);
							return id;
						}
						return response.data;
					}
				}
			};
		}
		return response.data;
	},
	async signin(id){
		var row = globals.database.prepare("SELECT * FROM accounts WHERE id = ?").get(id);
		if(!row){
			throw new Error("Account does not exist");
		}
		if(row.region > 1){
			throw new Error("Account not signed in");
		}
		var region = row.region == 0 ? "global" : "japan";
		var body = device.convertDeviceToBody(row);
		var headers = {
			Accept: "*/*",
			Authorization: "Basic " + row.identifier.toString("base64"),
			'Content-Type': "application/json",
			'X-UserCountry': row.region == 0 ? "US" : "JP",
			'X-UserCurrency': row.region == 0 ? "USD" : "JPY",
			'X-Platform': body.user_account.platform,
			'X-ClientVersion': globals.versions[region][body.user_account.platform],
			'X-Language': row.region == 0 ? "en" : "jp",
			'User-Agent': globals.agents[body.user_account.platform]
		};
		var response = await axios.post(globals.baseUrls[region] + "/auth/sign_in", JSON.stringify(body), {headers});
		if(response.data.captcha_result == "success"){
			globals.sessions[id] = {
				accessToken: response.data.access_token,
				secret: response.data.secret,
				algorithm: response.data.algorithm.replace(/-/g, "").substring(4),
				platform: body.user_account.platform,
				region
			};
			return;
		}else if(response.data.reason == "Require Captcha"){
			return { 
				captcha: {
					url: response.data.captcha_url,
					done: async function(){
						body.captcha_session_key = response.data.captcha_session_key;
						response = await axios.post(globals.baseUrls[region] + "/auth/sign_in", JSON.stringify(body), {headers});
						if(response.data.captcha_result == "success"){
							globals.sessions[id] = {
								accessToken: response.data.access_token,
								secret: response.data.secret,
								algorithm: response.data.algorithm.replace(/-/g, "").substring(4),
								platform: body.user_account.platform,
								region
							};
							return;
						}
						return response.data;
					}
				}
			};
		}
		return response.data;
	}
}