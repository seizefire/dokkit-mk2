const axios = require("./axios");
const device = require("./device");
const globals = require("../globals");

module.exports = {
	/**
	 * @param {string} endpoint 
	 * @param {string} id 
	 */
	get(endpoint, id){
		var session = globals.sessions[id];
		var {platform, region} = session;
		return axios.get(globals.baseUrls[region] + endpoint, {
			headers: {
				'X-Platform': platform,
				'X-ClientVersion': globals.versions[region][platform],
				'X-AssetVersion': globals.assetVersions[region],
				'X-DatabaseVersion': globals.databaseVersions[region],
				'X-Language': region == "global" ? "en" : "jp",
				'Authorization': device.generateMAC("GET", endpoint, session),
				'User-Agent': globals.agents[platform]
			}
		})
	},
	/**
	 * @param {string} endpoint 
	 * @param {string} id 
	 */
	post(endpoint, id, data){
		var session = globals.sessions[id];
		var {platform, region} = session;
		return axios.post(globals.baseUrls[region] + endpoint, JSON.stringify(data), {
			headers: {	
				'X-Platform': platform,
				'X-ClientVersion': globals.versions[region][platform],
				'X-AssetVersion': globals.assetVersions[region],
				'X-DatabaseVersion': globals.databaseVersions[region],
				'X-Language': region == "global" ? "en" : "jp",
				'Authorization': device.generateMAC("POST", endpoint, session),
				'User-Agent': globals.agents[platform],
				'Content-Type': "application/json"
			}
		})
	},
	/**
	 * @param {string} endpoint 
	 * @param {string} id 
	 */
	put(endpoint, id, data){
		var session = globals.sessions[id];
		var {platform, region} = session;
		return axios.put(globals.baseUrls[region] + endpoint, JSON.stringify(data), {
			headers: {	
				'X-Platform': platform,
				'X-ClientVersion': globals.versions[region][platform],
				'X-AssetVersion': globals.assetVersions[region],
				'X-DatabaseVersion': globals.databaseVersions[region],
				'X-Language': region == "global" ? "en" : "jp",
				'Authorization': device.generateMAC("PUT", endpoint, session),
				'User-Agent': globals.agents[platform],
				'Content-Type': "application/json"
			}
		})
	}
}