const http = require("axios/lib/adapters/http");
const path = require("path");
const axios = require("axios").default;
const Database = require("better-sqlite3");

const cwd = process.cwd();

module.exports = {
	agents: {
		android: "Dalvik/2.1.0 (Linux; Android 9.0; SM-S10)",
		ios: "CFNetwork/808.3 Darwin/16.3.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X)"
	},
	assetVersions: {global: 0, japan: 0},
	baseUrls: {global: "", japan: ""},
	bundles: {
		global: {
			android: "com.bandainamcogames.dbzdokkanww",
			ios: "jp.co.bandainamcogames.BNGI0221"
		},
		japan: {
			android: "com.bandainamcogames.dbzdokkan",
			ios: "jp.co.bandainamcogames.BNGI0211"
		}
	},
	database: new Database(path.join(cwd, "database.db")),
	databaseVersions: {global: 0, japan: 0},
	databasePasswords: {global: "", japan: ""},
	hosts: {global: "", japan: ""},
	async ping(){
		var globalPingResult = await axios.get("https://ishin-global.aktsk.com/ping", {
			headers: {
				'X-Platform': 'android',
				'X-ClientVersion': this.versions.global.android,
				'X-Language': 'en',
				'X-UserID': '////'
			},
			adapter: http,
		});
		this.hosts.global = globalPingResult.data.ping_info.host;
		this.ports.global = globalPingResult.data.ping_info.port;
		this.baseUrls.global = "https://" + this.hosts.global + ":" + this.ports.global;
		var japanPingResult = await axios.get("https://ishin-production.aktsk.jp/ping", {
			headers: {
				'X-Platform': 'android',
				'X-ClientVersion': this.versions.japan.android,
				'X-Language': 'jp',
				'X-UserID': '////'
			},
			adapter: http
		});
		this.hosts.japan = japanPingResult.data.ping_info.host;
		this.ports.japan = japanPingResult.data.ping_info.port;
		this.baseUrls.japan = "https://" + this.hosts.japan + ":" + this.ports.japan;
	},
	ports: {global: 443, japan: 443},
	/** @type {{[x: string]: {accessToken: string, secret: string, algorithm: string, platform: "android" | "japan", region: "global" | "japan"}}} */
	sessions: {},
	signaturePasswords: {global: "", japan: ""},
	/** @type {{[x: string]: Database.Database} */
	userDatabases: {},
	versions: {
		global: {android: "", ios: ""},
		japan: {android: "", ios: ""}
	},
}