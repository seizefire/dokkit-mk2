const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Database = require("better-sqlite3");

const baseDirectory = path.dirname(path.dirname(__dirname));
const configPath = path.join(baseDirectory, "config.json");
const databasePath = path.join(baseDirectory, "database.db");

const database = new Database(databasePath);

const keyring = ["bc48ce1cb27637da4ee2317fcdcd26516fe36b18", "e2056fcac1acf372e499e23c757c12fe106e4d84", "e4734b234225492a212796a6342a0c4ee4137749", "f5c2f0e81a3066e97fb83c4cc3ace83f79b51e37"];

const accountTableFormat = "ad_id|B|brand|I|id|I|identifier|B|model|I|name|T|platform|I|rank|I|region|I|stones|I|unique_id|B|version|I|zeni|I";
const androidVersions = ["5.0","5.0.1","5.0.2","5.1","5.1.1","6.0","6.0.1","7.0","7.1","7.1.1","7.1.2","8.0","8.1","9.0","10.0","11.0","12.0"];
const samsungDevices = ["Galaxy S5", "SM-G900I", 0, 6, "Galaxy S6", "SM-G920I", 0, 7, "Galaxy S6 Edge", "SM-G925I", 0, 7, "Galaxy S6 Edge+", "SM-G928I", 0, 7, "Galaxy S7", "SM-G930F", 6, 11, "Galaxy S7 Edge", "SM-G935F", 6, 11, "Galaxy S8", "SM-G950F", 7, 13, "Galaxy S8+", "SM-G955F", 7, 13, "Galaxy S9", "SM-G960F", 11, 14, "Galaxy S9+", "SM-G965F", 11, 14, "Galaxy S10e", "SM-G970F", 13, 16, "Galaxy S10", "SM-G973F", 13, 16, "Galaxy S10+", "SM-G975F", 13, 16, "Galaxy S10 5G", "SM-G977B", 13, 15, "Galaxy S10 Lite", "SM-G770F", 13, 16, "Galaxy Note 5", "SM-N920I", 4, 7, "Galaxy Note 8", "SM-N950F", 9, 13, "Galaxy Note 9", "SM-N960F", 12, 14];
const iosVersions = ["13.0","13.1","13.1.1","13.1.2","13.1.3","13.2","13.2.1","13.2.2","13.2.3","13.3","13.3.1","13.4","13.4.1","13.5","13.5.1","13.6","13.6.1","13.7","14.0","14.0.1","14.1","14.2","14.2.1","14.3","14.4","14.4.1","14.4.2","14.5","14.5.1","14.6","14.7","14.7.1","14.8","14.8.1"]
const iphones = ["iPhone 7", "iPhone 7 Plus", "iPhone 8", "iPhone 8 Plus", "iPhone X", "iPhone XR", "iPhone XS", "iPhone 11", "iPhone 11 Pro"]

const random = (min, max) => Math.min(Math.floor(Math.random() * (max - min + 1)) + min, max);
const isDatabaseVersion = version => version && /^(\d+\.){2}\d+-[\da-fA-F]{64}$/.test(version);
const isPositiveInteger = integer => integer && typeof integer == "number" && integer > 0 && integer % 1 == 0;

var config = {
	assetVersions: {global: 0, japan: 0},
	databaseVersions: {global: 0, japan: 0},
	databasePasswords: {global: "", japan: ""},
	signaturePasswords: {global: "", japan: ""},
	versions: {
		global: {android: "", ios: ""},
		japan: {android: "", ios: ""}
	}
};
var hosts = {global: "", japan: ""};
var baseUrls = {global: "", japan: ""};

function cleanObject(object, keys){
	var objectKeys = Object.keys(object);
	for(let i of objectKeys){
		if(!keys.includes(i)){
			delete object[i];
		}
	}
	return object;
}
/**
 * @param {Buffer} buffer
 */
function convertToUUID(buffer){
	var str = buffer.toString("hex").toLowerCase();
	return str.substring(0, 8) + "-" + str.substring(8, 12) + "-" + str.substring(12, 16) + "-" + str.substring(16, 20) + "-" + str.substring(20, 32);
}

module.exports = {
	constants: {
		agents: {
			android: "Dalvik/2.1.0 (Linux; Android 9.0; SM-S10)",
			ios: "CFNetwork/808.3 Darwin/16.3.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X)"
		},
		assetVersions: config.assetVersions,
		baseUrls,
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
		databasePasswords: config.databasePasswords,
		databaseVersions: config.databaseVersions,
		hosts,
		signaturePasswords: config.signaturePasswords,
		versions: config.versions
	},
	convertDeviceToBody(device){
		var aid = convertToUUID(device.ad_id);
		var uid = convertToUUID(device.unique_id) + ":" + device.unique_id.slice(16).toString("hex").toLowerCase();
		var platform = device.platform == 0 || device.platform == 2 ? "android" : "ios";
		return {
			bundle_id: this.constants.bundles[device.region == 0 ? "global" : "japan"][device.platform == 0 ? "android" : "ios"],
			device_token: "failed",
			reason: "NETWORK_ERROR: null",
			user_account: {
				ad_id: aid,
				device: platform == "ios" ? "iPhone" : "samsung",
				device_model: platform == "ios" ? iphones[device.model] : samsungDevices[device.model * 4 + 1],
				os_version: platform == "ios" ? iosVersions[device.version] : androidVersions[device.version],
				platform,
				unique_id: uid
			}
		}
	},
	/**
	 * @param {"global"|"japan"} region
	 * @param {"android"|"ios"} platform
	 */
	generateRandomDevice(region, platform){
		var device = {
			ad_id: crypto.randomBytes(16),
			brand: 0,
			platform: platform == "android" ? 0 : 1,
			region: region == "global" ? 0 : 1,
			unique_id: crypto.randomBytes(24)
		}
		if(platform == "android"){
			device.model = random(0, samsungDevices.length / 4 - 1);
			let minimumVersion = samsungDevices[device.model * 4 + 2];
			let maximumVersion = samsungDevices[device.model * 4 + 3];
			device.version = random(minimumVersion, maximumVersion);
		}else{
			device.model = random(0, iphones.length - 1);
			device.version = random(0, iosVersions.length - 1);
		}
		return device;
	},
	getAccount(id, region){
		var row = database.prepare("SELECT * FROM accounts WHERE id = ? AND region = ?").get(id, region == "global" ? 0 : 1);
		if(!row){
			throw new Error("DKN_NOT_EXIST: Account does not exist");
		}
		return row;
	},
	insertNewAccount(data, device){
		let parts = Buffer.from(identifier.split("\n").join(), "base64").toString().split(":");
		let basic = Buffer.from(parts[1] + ":" + parts[0]);
		database.prepare("INSERT INTO accounts VALUES (?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?)").run(data.user.id, data.user.name, device.region, basic, device.platform, device.brand, device.model, device.version, device.ad_id, device.unique_id);
	},
	async loadConfiguration(){
		if(!fs.existsSync(configPath)){
			await this.loadRemoteConfiguration();
			return false;
		}
		try {
			var sections = 0;
			var localConfig = JSON.parse(fs.readFileSync(configPath).toString());
			if(isPositiveInteger(localConfig?.assetVersions?.global) && isPositiveInteger(localConfig?.assetVersions?.japan)){
				config.assetVersions = cleanObject(localConfig.assetVersions, ["global", "japan"]);
			}
			if(isPositiveInteger(localConfig?.databaseVersions?.global) && isPositiveInteger(localConfig?.databaseVersions?.japan)){
				config.databaseVersions = cleanObject(localConfig.databaseVersions, ["global", "japan"]);
			}
			if(localConfig?.databasePasswords?.global && localConfig?.databasePasswords?.japan){
				config.databasePasswords = cleanObject(localConfig.databasePasswords, ["global", "japan"]);
				++sections;
			}
			if(localConfig?.signaturePasswords?.global && localConfig?.signaturePasswords?.japan){
				config.signaturePasswords = cleanObject(localConfig.signaturePasswords, ["global", "japan"]);
				++sections;
			}
			if(isDatabaseVersion(localConfig?.versions?.global?.android) && isDatabaseVersion(localConfig?.versions?.global?.ios) && isDatabaseVersion(localConfig?.versions?.japan?.android) && isDatabaseVersion(localConfig?.versions?.japan?.ios)){
				config.versions.global = cleanObject(localConfig.versions.global, ["android", "ios"]);
				config.versions.japan = cleanObject(localConfig.versions.japan, ["android", "ios"]);
				++sections;
			}
			if(sections < 3){
				await this.loadRemoteConfiguration();
				return false;
			}
			return true;
		}catch(err){
			await this.loadRemoteConfiguration();
			return false;
		}
	},
	loadDatabase(){
		var tables = database.prepare("SELECT name FROM sqlite_master WHERE type = ?").all("table").map(v => v.name);
		if(!tables.includes("accounts")){
			database.prepare(`CREATE TABLE "accounts" ("id" INTEGER NOT NULL UNIQUE, "name" TEXT NOT NULL, "rank" INTEGER, "stones" INTEGER, "zeni" INTEGER, "region" INTEGER NOT NULL, "identifier" BLOB, "platform" INTEGER NOT NULL, "brand" INTEGER NOT NULL, "model" INTEGER NOT NULL, "version" INTEGER NOT NULL, "ad_id" BLOB NOT NULL, "unique_id" BLOB NOT NULL, PRIMARY KEY("id"))`).run();
		}else{
			let columns = database.prepare("SELECT * FROM pragma_table_info(?) ORDER BY cid ASC;").all("accounts");
			let tableFormat = columns.sort((a, b) => a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)).map(v => v.name + "|" + v.type[0]).join("|");
			if(tableFormat !== accountTableFormat){
				let index = 1;
				while(tables.includes("___backup__accounts_" + index)){
					++index;
				}
				database.prepare("ALTER TABLE accounts RENAME TO ___backup__accounts_" + index).run();
				database.prepare(`CREATE TABLE "accounts" ("id" INTEGER NOT NULL UNIQUE, "name" TEXT NOT NULL, "rank" INTEGER, "stones" INTEGER, "zeni" INTEGER, "region" INTEGER NOT NULL, "identifier" BLOB, "platform" INTEGER NOT NULL, "brand" INTEGER NOT NULL, "model" INTEGER NOT NULL, "version" INTEGER NOT NULL, "ad_id" BLOB NOT NULL, "unique_id" BLOB NOT NULL, PRIMARY KEY("id"))`).run();
			}
		}
	},
	async loadPingInformation(){
		var globalPingResult = await axios.get("https://ishin-global.aktsk.com/ping", {
			headers: {
				'X-Platform': 'android',
				'X-ClientVersion': versions.global.android,
				'X-Language': 'en',
				'X-UserID': '////'
			}
		});
		hosts.global = globalPingResult.data.ping_info.host;
		baseUrls.global = "https://" + hosts.global + ":" + globalPingResult.data.ping_info.port;
		var japanPingResult = await axios.get("https://ishin-production.aktsk.jp/ping", {
			headers: {
				'X-Platform': 'android',
				'X-ClientVersion': versions.japan.android,
				'X-Language': 'jp',
				'X-UserID': '////'
			}
		});
		hosts.japan = japanPingResult.data.ping_info.host;
		baseUrls.japan = "https://" + hosts.japan + ":" + japanPingResult.data.ping_info.port;
	},
	async loadRemoteConfiguration(){
		var response = await axios.get("http://lucidfacs.cf/K1mpl0s/16/auth.php?action=access&key=" + keyring[Math.max(keyring.length - 1, Math.floor(Math.random() * keyring.length))] + "&v=412p14&mobile=False", {
			headers: {
				'User-Agent': "python-requests/2.27.1"
			}
		});
		if(!response.data || !response.data.data){
			throw new Error("DKN_K1MPL0S: Request to remote server failed");
		}
		var info = JSON.parse(Buffer.from(response.data.data, "base64").toString());
		if(!info.skids || !info.skids[1] || !info.skids[1].android){
			throw new Error("DKN_K1MPL0S: Malformed request format");
		}
		config.versions.global.android = info.skids[0].android;
		config.versions.global.ios = info.skids[0].ios;
		config.versions.japan.android = info.skids[1].android;
		config.versions.japan.ios = info.skids[1].ios;
		config.databasePasswords.global = info.skids[2][0];
		config.databasePasswords.japan = info.skids[2][1];
		config.signaturePasswords.global = info.skids[2][4];
		config.signaturePasswords.japan = info.skids[2][2];
		this.saveConfiguration();
	},
	saveConfiguration(){
		fs.writeFileSync(configPath, JSON.stringify(config, null, "\t"));
	}
};