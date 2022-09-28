const data = require("./utils/data");
const axios = require("./utils/axios");
const utils = require("./utils");

// is_ondemand: boolean, boost_point: number, act_at: number, boost_at: number, wallpaper_item_id: number, achievement_id: number, mainpage_card_id: number, mainpage_user_card_id: number, mydata_subpage_visible: boolean, battle_energy: {energy: number, recover_point_with_stone: number, battle_at: number, seconds_per_cure: number, max_recovery_count: number, recovered_count: number} gasha_point: number, tutorial.contents_lv: number
/** @typedef {{id: number, name: string, rank: number, exp: number, stones: number, zeni: number, babaPoints: number, stamina: number, maxStamina: number, friendCapacity: number, potentialReleasable: boolean, cards: {count: number, capacity: number}, supportItems: { capacity: number, expanded: boolean}, tutorial: { progress: number, finished: boolean}}} UserData */

function Captcha(response, handler){
	this.url = response.captcha_url;
	this.sessionKey = response.captcha_session_key;
	this.done = handler;
}
/** @returns {Promise<T>} */
Captcha.prototype.done = function(){};

async function updateTutorialProgress(progress, session, region){
	var response = await axios.put(config[region].host + "/tutorial", JSON.stringify({progress}), {
		
	})
}

var sessions = {
	global: {},
	japan: {}
}

module.exports = {
	/**
	 * @param {Session} session 
	 * @param {string} [name]
	 * @param {UserData} [userData]
	 */
	async completeTutorial(session, name, userData){
		// 0: Raditz pulls up to Kame House (Dialogue)
		// 10201: Goku and Piccolo pull up on Raditz (Dialogue)
		// 20101: Goku and Piccolo fight Raditz (Fight)
		// 30101: Goku's death (Dialogue)
		// 40101: Bulma Scouter (Dialogue)
		// 50101: Tutorial summon (Summon)
		// 60101: King Kai Dialogue
		// 70101: Training
		// 80101: Awakening tutorial
		// 90101: Dokkan Awakening
		// 100101: Post-Training Dialogue
		// 110101: Goku messes up Nappa
		// 120101: 
		// 150101: Name change
		// 160101: 
		// 999999: End
		const tutorialProgressValues = [0, 10201, 20101, 30101, 40101, 50101, 60101, 70101, 80101, 90101, 100101, 110101, 120101, 150101, 160101];
		if(!userData){
			userData = await this.getUserData(session);
		}
		if(userData.tutorial.finished){
			return;
		}
		var progress = tutorialProgressValues.indexOf(userData.tutorial.progress);
		for(let i = progress; i < 6; ++i){
			
		}
	},
	/**
	 * @param {Session} session 
	 * @param {"global"|"japan"} region 
	 * @returns {UserData}
	 */
	async getUserData(session, region){
		var platform = session.account.platform;
		var response = await axios.get(config[region].host + "/user", {
			headers: {
				'X-Platform': platform,
				'X-ClientVersion': config[region].versions[platform],
				'X-AssetVersion': '1650434428',
				'X-DatabaseVersion': '1650434409',
				'Content-Type': 'application/json',
				'Accept': '*/*',
				'Authorization': utils.generateMAC("GET", "/user", session, region),
				'X-Language': 'en',
				'User-Agent': config.agents[platform]
			}
		});
		if(response.data.user){
			return {id: response.data.user.id, name: response.data.user.name, rank: response.data.user.rank, exp: response.data.user.exp, stones: response.data.user.stone, zeni: response.data.user.zeni, babaPoints: response.data.user.exchange_point, stamina: response.data.user.act, maxStamina: response.data.user.act_max, friendCapacity: response.data.user.friends_capacity, potentialReleasable: response.data.user.is_potential_releaseable, cards: {count: response.data.user.card_capacity, capacity: response.data.user.total_card_capacity}, supportItems: {capacity: response.data.user.support_item_capacity, expanded: response.data.user.is_support_item_capacity_extended}, tutorial: {progress: response.data.user.tutorial.progress, finished: response.data.user.tutorial.is_finished}};
		}else if(response.data.error?.code){
			throw new Error("DKN_ERROR: " + response.data.error.code);
		}else{
			throw new Error("DKN_UNKNOWN_RESPONSE: " + JSON.stringify(response.data));
		}
	},
	
	/**
	 * @param {"global"|"japan"} region 
	 * @param {"android"|"ios"} platform 
	 * @returns {Promise<number|Captcha<number>>}
	 */
	async signup(region, platform){
		var row = data.generateRandomDevice(region, platform);
		var body = data.convertDeviceToBody(row);
		var headers = {
			'Accept': "*/*",
			'Content-Type': "application/json",
			'X-Platform': platform,
			'X-ClientVersion': data.constants.versions[region][platform],
			'X-Language': region == "global" ? "en" : "jp",
			'User-Agent': data.constants.agents[platform]
		};
		var response = await axios.post(data.constants.hosts[region] + "/auth/sign_up", JSON.stringify(body), {headers})
		if(response.data.identifier && response.data.user){
			data.insertNewAccount(response.data, row);
			return response.data.user.id;
		}else if(response.data.reason == "Require Captcha"){
			return new Captcha(response.data, async function(){
				body.captcha_session_key = response.data.captcha_session_key;
				body.user_account.country = region == "global" ? "US" : "JP";
				body.user_account.currency = region == "global" ? "USD" : "JPY";
				response = await axios.post(config[region].host + "/auth/sign_up", JSON.stringify(body), {headers});
				if(response.data.captcha_result == "success"){
					data.insertNewAccount(response.data, row);
					return response.data.user.id;
				}
				return response.data;
			})
		}
		return response.data;
	},
	/**
	 * @param {number} id
	 * @param {"global"|"japan"} region
	 * @returns {Promise<Captcha<void>|void>}
	 */
	async signin(id, region){
		var row = data.getAccount(id, region);
		var body = data.convertDeviceToBody(row);
		var headers = {
			Accept: "*/*",
			Authorization: "Basic " + row.identifier.toString("base64"),
			'Content-Type': "application/json",
			'X-UserCountry': region == "global" ? "US" : "JP",
			'X-UserCurrency': region == "global" ? "USD" : "JPY",
			'X-Platform': body.user_account.platform,
			'X-ClientVersion': data.constants.versions[region][body.user_account.platform],
			'X-Language': region == "global" ? "en" : "jp",
			'User-Agent': data.constants.agents[body.user_account.platform]
		};
		var response = await axios.post(data.constants.hosts[region] + "/auth/sign_in", JSON.stringify(body), {headers});
		if(response.data.captcha_result == "success"){
			sessions[region] = {
				accessToken: response.data.access_token,
				secret: response.data.secret,
				algorithm: response.data.algorithm.replace(/-/g, "").substring(4)
			};
			return;
		}else if(response.data.reason == "Require Captcha"){
			return new Captcha(response.data, async function(){
				body.captcha_session_key = response.data.captcha_session_key;
				response = await axios.post(data.constants.hosts[region] + "/auth/sign_in", JSON.stringify(body), {headers});
				if(response.data.captcha_result == "success"){
					sessions[region] = {
						accessToken: response.data.access_token,
						secret: response.data.secret,
						algorithm: response.data.algorithm.replace(/-/g, "").substring(4)
					};
					return;
				}
				return response.data;
			})
		}
		return response.data;
	}
}