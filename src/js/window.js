const globals = require("./js/globals");

const {loadConfiguration} = require("./js/data/config");
const {prepareMainDatabase} = require("./js/data/database");
const {signup, signin} = require("./js/auth/aktsk");
const request = require("./js/utils/request");

document.addEventListener("DOMContentLoaded", async function(){
	const queue = require("./js/commands/queue");
	const downloads = require("./js/commands/downloads");

	await loadConfiguration();
	await prepareMainDatabase();
	await globals.ping();
	var signinResult = await signin("global1764840441");
	if(signinResult && signinResult.captcha){
		console.log(signinResult.captcha.url);
		await new Promise(function(resolve){
			setTimeout(function(){
				resolve();
			}, 20000);
		})
		await signinResult.captcha.done();
	}
	window.request = request;
	queue.setMission("Logging into \"Test\"");
	await downloads.downloadDatabase("global1764840441");
	queue.setMission("");
});