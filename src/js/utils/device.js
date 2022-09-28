const crypto = require("crypto");
const globals = require("../globals");

const androidVersions = ["5.0","5.0.1","5.0.2","5.1","5.1.1","6.0","6.0.1","7.0","7.1","7.1.1","7.1.2","8.0","8.1","9.0","10.0","11.0","12.0"];
const samsungDevices = ["Galaxy S5", "SM-G900I", 0, 6, "Galaxy S6", "SM-G920I", 0, 7, "Galaxy S6 Edge", "SM-G925I", 0, 7, "Galaxy S6 Edge+", "SM-G928I", 0, 7, "Galaxy S7", "SM-G930F", 6, 11, "Galaxy S7 Edge", "SM-G935F", 6, 11, "Galaxy S8", "SM-G950F", 7, 13, "Galaxy S8+", "SM-G955F", 7, 13, "Galaxy S9", "SM-G960F", 11, 14, "Galaxy S9+", "SM-G965F", 11, 14, "Galaxy S10e", "SM-G970F", 13, 16, "Galaxy S10", "SM-G973F", 13, 16, "Galaxy S10+", "SM-G975F", 13, 16, "Galaxy S10 5G", "SM-G977B", 13, 15, "Galaxy S10 Lite", "SM-G770F", 13, 16, "Galaxy Note 5", "SM-N920I", 4, 7, "Galaxy Note 8", "SM-N950F", 9, 13, "Galaxy Note 9", "SM-N960F", 12, 14];
const iosVersions = ["13.0","13.1","13.1.1","13.1.2","13.1.3","13.2","13.2.1","13.2.2","13.2.3","13.3","13.3.1","13.4","13.4.1","13.5","13.5.1","13.6","13.6.1","13.7","14.0","14.0.1","14.1","14.2","14.2.1","14.3","14.4","14.4.1","14.4.2","14.5","14.5.1","14.6","14.7","14.7.1","14.8","14.8.1"]
const iphones = ["iPhone 7", "iPhone 7 Plus", "iPhone 8", "iPhone 8 Plus", "iPhone X", "iPhone XR", "iPhone XS", "iPhone 11", "iPhone 11 Pro"]

const random = (min, max) => Math.min(Math.floor(Math.random() * (max - min + 1)) + min, max);

/**
 * @param {Buffer} buffer
 */
function convertToUUID(buffer){
	var str = buffer.toString("hex").toLowerCase();
	return str.substring(0, 8) + "-" + str.substring(8, 12) + "-" + str.substring(12, 16) + "-" + str.substring(16, 20) + "-" + str.substring(20, 32);
}

/**
 * @param {string} password 
 * @param {Buffer} salt 
 * @param {number} key_length 
 * @param {number} iv_length 
 * @param {"md5"|"sha1"|"sha256"|"sha512"} digest 
 */
function getKeyAndIV(password, salt, key_length = 32, iv_length = 16, digest = "md5"){
	var max_length = key_length + iv_length;
	password = password.replace(/\\x[\dA-Fa-f]{2}/g, function(value){
		return String.fromCharCode(parseInt(value.substring(2), 16));
	})
	password = Buffer.from(password, "ascii");
	var hash = crypto.createHash(digest);
	hash.update(password);
	hash.update(salt);
	var keyiv = hash.digest();
	if(keyiv.length < max_length){
		let temp = [keyiv];
		for(let i = 0; i < max_length - keyiv.length; ++i){
			let hash = crypto.createHash(digest);
			hash.update(temp[i]);
			hash.update(password);
			hash.update(salt);
			let ivhash = hash.digest();
			temp.push(ivhash);
			keyiv = Buffer.concat([keyiv, ivhash])
		}
	}
	return {
		key: keyiv.slice(0, key_length),
		iv: keyiv.slice(key_length, key_length + iv_length)
	}
}

module.exports = {
	convertDeviceToBody(device){
		var aid = convertToUUID(device.ad_id);
		var uid = convertToUUID(device.unique_id) + ":" + device.unique_id.slice(16).toString("hex").toLowerCase();
		var platform = device.platform == 0 ? "android" : "ios";
		return {
			bundle_id: globals.bundles[device.region == 0 || device.region == 2 ? "global" : "japan"][platform],
			device_token: "failed",
			reason: "NETWORK_ERROR: null",
			user_account: {
				ad_id: aid,
				device: device.platform == 1 ? "iPhone" : "samsung",
				device_model: device.platform == 1 ? iphones[device.model] : samsungDevices[device.model * 4 + 1],
				os_version: device.platform == 1 ? iosVersions[device.version] : androidVersions[device.version],
				platform,
				unique_id: uid
			}
		}
	},
	/**
	 * @param {string} sign 
	 * @param {string} id 
	 */
	decryptSign(sign, id){
		var region = globals.sessions[id].region;
		var buffer = Buffer.from(sign, "base64");
		var salt = buffer.slice(0, 8);
		var {key, iv} = getKeyAndIV(globals.signaturePasswords[region], salt, 32, 16, "md5");
		var data = buffer.slice(8);
		var aes = crypto.createDecipheriv("aes-256-cbc", key, iv);
		aes.setAutoPadding(false);
		var dec = Buffer.concat([aes.update(data), aes.final()]).toString();
		dec = dec.substring(0, dec.lastIndexOf("}") + 1);
		return JSON.parse(dec);
	},
	/**
	 * @param {string} data 
	 * @param {string} id 
	 */
	encryptSign(data, id){
		var region = globals.sessions[id].region;
		var buffer = Buffer.from(JSON.stringify(data));
		var paddingSize = buffer.length % 16;
		if(paddingSize > 0){
			let padding = Buffer.alloc(paddingSize);
			padding.fill(paddingSize);
			buffer = Buffer.concat([buffer, padding]);
		}
		var salt = crypto.randomBytes(8);
		var {key, iv} = getKeyAndIV(globals.signaturePasswords[region], salt, 32, 16, "md5");
		var aes = crypto.createCipheriv("aes-256-cbc", key, iv);
		aes.setAutoPadding(false);
		var enc = Buffer.concat([salt, aes.update(buffer), aes.final()]);
		return enc.toString("base64");
	},
	/**
	 * @param {"GET"|"POST"|"PUT"} method
	 * @param {string} endpoint
	 * @param {"global"|"japan"} region
	 */
	generateMAC(method, endpoint, session){
		var host = globals.hosts[session.region];
		var port = globals.ports[session.region];
		var ts = Math.round(Date.now() / 1000).toString();
		var nonce = ts + ":" + crypto.createHash("md5").update(ts).digest("hex").toLowerCase();
		var signature = ts + "\n" + nonce + "\n" + method.toUpperCase() + "\n" + endpoint + "\n" + host + "\n" + port + "\n\n";
		var hmac = crypto.createHmac(session.algorithm, Buffer.from(session.secret));
		hmac.update(signature);
		var mac = hmac.digest("base64");
		return 'MAC id="' + session.accessToken + '", nonce="' + nonce + '", ts="' + ts + '", mac="' + mac + '"';
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
	}
};