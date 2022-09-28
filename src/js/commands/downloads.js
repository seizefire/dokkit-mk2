const fs = require("fs");
const path = require("path");
const axios = require("../utils/axios");
const queue = require("./queue");
const generic = require("../utils/generic");
const globals = require("../globals");
const request = require("../utils/request");
const sqlcipher = require("mini-sqlcipher");

function downloadFile(url, path, id, name, quotes = true){
	if(quotes){
		name = '"' + name + '"';
	}
	return new Promise(function(resolve, reject){
		axios.get(url, {
			headers: {
				'User-Agent': globals.agents[globals.sessions[id].platform]
			},
			responseType: "stream"
		}).then(function(resp){
			queue.setTask("Downloading " + name);
			var size = parseInt(resp.headers['content-length']);
			var stream = resp.data;
			var sizeString = generic.numberToByteSize(size);
			var written = 0;
			var writeStream = fs.createWriteStream(path);
			var interval = setInterval(function(){
				queue.setProgress(written, 0, size, generic.numberToByteSize(written) + " / " + sizeString);
			}, 250);
			stream.on("data", function(buf){
				written += buf.length;
			});
			stream.on("end", function(){
				writeStream.end(function(){
					clearInterval(interval);
					resolve();
				});
			})
			stream.pipe(writeStream);
		})
	});
}

module.exports = {
	async downloadAssets(id){
		var response = await request.get("/client_assets", id);
	},
	async downloadDatabase(id){
		var region = globals.sessions[id].region;
		queue.setTask("Checking " + region + " database");
		queue.setProgress("", 0, 0, "");
		var response = await request.get("/client_assets/database", id);
		if(response.data.error){
			throw response.data;
		}
		if(response.data.version === globals.databaseVersions[region]){
			return;
		}
		var encPath = path.join(process.cwd(), region+"-enc.db");
		var decPath = path.join(process.cwd(), region+".db");
		await downloadFile(response.data.url, encPath, id, "global database", false);
		queue.setTask("Decrypting " + region + " database");
		queue.setProgress(1, 0, 1, "");
		await generic.timeout(80);
		sqlcipher.decryptFile(encPath, decPath, globals.databasePasswords[region], sqlcipher.SQLCIPHER3);
		queue.setTask("");
		queue.setProgress(0, 0, 1, "");
	}
}