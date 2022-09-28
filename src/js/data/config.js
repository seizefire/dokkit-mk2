const fs = require("fs");
const http = require("axios/lib/adapters/http");
const path = require("path");
const axios = require("axios").default;
const globals = require("../globals");

const keyring = ["bc48ce1cb27637da4ee2317fcdcd26516fe36b18", "e2056fcac1acf372e499e23c757c12fe106e4d84", "e4734b234225492a212796a6342a0c4ee4137749", "f5c2f0e81a3066e97fb83c4cc3ace83f79b51e37"];
const configPath = path.join(process.cwd(), "config.json");

const random = (min, max) => Math.min(Math.floor(Math.random() * (max - min + 1)) + min, max);
const isDatabaseVersion = version => version && /^(\d+\.){2}\d+-[\da-fA-F]{64}$/.test(version);
const isPositiveInteger = integer => integer && typeof integer == "number" && integer > 0 && integer % 1 == 0;

function cleanObject(object, keys){
	var objectKeys = Object.keys(object);
	for(let i of objectKeys){
		if(!keys.includes(i)){
			delete object[i];
		}
	}
	return object;
}

var moduleExports = {
	async loadConfiguration(){
		if(!fs.existsSync(configPath)){
			await moduleExports.loadRemoteConfiguration();
			return false;
		}
		try {
			var sections = 0;
			var localConfig = JSON.parse(fs.readFileSync(configPath).toString());
			if(isPositiveInteger(localConfig?.assetVersions?.global) && isPositiveInteger(localConfig?.assetVersions?.japan)){
				globals.assetVersions = cleanObject(localConfig.assetVersions, ["global", "japan"]);
			}
			if(isPositiveInteger(localConfig?.databaseVersions?.global) && isPositiveInteger(localConfig?.databaseVersions?.japan)){
				globals.databaseVersions = cleanObject(localConfig.databaseVersions, ["global", "japan"]);
			}
			if(localConfig?.databasePasswords?.global && localConfig?.databasePasswords?.japan){
				globals.databasePasswords = cleanObject(localConfig.databasePasswords, ["global", "japan"]);
				++sections;
			}
			if(localConfig?.signaturePasswords?.global && localConfig?.signaturePasswords?.japan){
				globals.signaturePasswords = cleanObject(localConfig.signaturePasswords, ["global", "japan"]);
				++sections;
			}
			if(isDatabaseVersion(localConfig?.versions?.global?.android) && isDatabaseVersion(localConfig?.versions?.global?.ios) && isDatabaseVersion(localConfig?.versions?.japan?.android) && isDatabaseVersion(localConfig?.versions?.japan?.ios)){
				globals.versions.global = cleanObject(localConfig.versions.global, ["android", "ios"]);
				globals.versions.japan = cleanObject(localConfig.versions.japan, ["android", "ios"]);
				++sections;
			}
			if(sections < 3){
				await moduleExports.loadRemoteConfiguration();
				return false;
			}
			return true;
		}catch(err){
			await moduleExports.loadRemoteConfiguration();
			return false;
		}
	},
	async loadRemoteConfiguration(){
		var response = await axios.get("http://lucidfacs.cf/K1mpl0s/16/auth.php?action=access&key=" + keyring[random(0, keyring.length - 1)] + "&v=412p88&mobile=False", {
			headers: {
				'User-Agent': "python-requests/2.27.1"
			},
			adapter: http
		});
		if(!response.data || !response.data.data){
			throw new Error("DKN_K1MPL0S: Request to remote server failed");
		}
		var info = JSON.parse(Buffer.from(response.data.data, "base64").toString());
		if(!info.skids || !info.skids[1] || !info.skids[1].android){
			throw new Error("DKN_K1MPL0S: Malformed request format");
		}
		globals.versions.global.android = info.skids[0].android;
		globals.versions.global.ios = info.skids[0].ios;
		globals.versions.japan.android = info.skids[1].android;
		globals.versions.japan.ios = info.skids[1].ios;
		globals.databasePasswords.global = info.skids[2][0];
		globals.databasePasswords.japan = info.skids[2][1];
		globals.signaturePasswords.global = info.skids[2][4];
		globals.signaturePasswords.japan = info.skids[2][2];
		moduleExports.saveConfiguration();
	},
	saveConfiguration(){
		fs.writeFileSync(configPath, JSON.stringify({
			assetVersions: cleanObject(globals.assetVersions, ["global", "japan"]),
			databasePasswords: cleanObject(globals.databasePasswords, ["global", "japan"]),
			databaseVersions: cleanObject(globals.databaseVersions, ["global", "japan"]),
			signaturePasswords: cleanObject(globals.signaturePasswords, ["global", "japan"]),
			versions: {
				global: cleanObject(globals.versions.global, ["android", "ios"]),
				japan: cleanObject(globals.versions.japan, ["android", "ios"])
			}
		}, null, "\t"));
	}
}
module.exports = moduleExports;