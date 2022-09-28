const crypto = require("crypto");
const globals = require("./globals");

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
	/**
	 * @param {string} sign 
	 * @param {"global"|"japan"} region 
	 */
	decryptSign(sign, region){
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
	 * @param {"global"|"japan"} region 
	 */
	encryptSign(data, region){
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
	generateMAC(method, endpoint, session, region){
		var host = globals.hosts[region].substring(8).split(":")[0];
		var port = globals.ports[region];
		var ts = Math.round(Date.now() / 1000).toString();
		var nonce = ts + ":" + crypto.createHash("md5").update(ts).digest("hex").toLowerCase();
		var signature = ts + "\n" + nonce + "\n" + method.toUpperCase() + "\n" + endpoint + "\n" + host + "\n" + port + "\n\n";
		var hmac = crypto.createHmac(session.algorithm, Buffer.from(session.secret));
		hmac.update(signature);
		var mac = hmac.digest("base64");
		return 'MAC id="' + session.accessToken + '", nonce="' + nonce + '", ts="' + ts + '", mac="' + mac + '"';
	}
};