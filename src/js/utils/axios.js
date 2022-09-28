const http = require("axios/lib/adapters/http");
const axios = require("axios");
const {loadRemoteConfiguration} = require("../data/config");

module.exports = {
	/**
	 * @param {string} url 
	 * @param {axios.AxiosRequestConfig<string>} config 
	 * @returns {Promise<axios.AxiosResponse<any,any>>}
	 */
	async get(url, config){
		config.adapter = http;
		try {
			return await axios.default.get(url, config);
		}catch(err){
			if(!err.response?.data){
				throw err;
			}
			if(err.response.data.error && err.response.data.error.code === "client_version/new_client_version_exists"){
				if(arguments[2]){
					throw new Error("DKN_UPDATE_NEEDED: Outdated version");
				}
				await loadRemoteConfiguration();
				return this.get(url, config, true);
			}
			return err.response;
		}
	},
	/**
	 * @param {string} url 
	 * @param {axios.AxiosRequestConfig<string>} config 
	 * @returns {Promise<axios.AxiosResponse<any,any>>}
	 */
	async post(url, data, config){
		config.adapter = http;
		try {
			return await axios.default.post(url, data, config);
		}catch(err){
			if(!err.response?.data){
				throw err;
			}
			if(err.response.data.error){
				if(err.response.data.error.code === "client_version/new_client_version_exists"){
					if(arguments[3]){
						throw new Error("DKN_UPDATE_NEEDED: Outdated version");
					}
					await loadRemoteConfiguration();
					return this.post(url, data, config, true);
				}
			}else if(err.response.data.captcha_result == "failed"){
				throw new Error("DKN_CAPTCHA_FAILED: The user failed the captcha");
			}
			return err.response;
		}
	},
	/**
	 * @param {string} url 
	 * @param {axios.AxiosRequestConfig<string>} config 
	 * @returns {Promise<axios.AxiosResponse<any,any>>}
	 */
	async put(url, data, config){
		config.adapter = http;
		try {
			return await axios.default.put(url, data, config);
		}catch(err){
			if(!err.response?.data){
				throw err;
			}
			if(err.response.data.error && err.response.data.error.code === "client_version/new_client_version_exists"){
				if(arguments[3]){
					throw new Error("DKN_UPDATE_NEEDED: Outdated version");
				}
				await loadRemoteConfiguration();
				return this.put(url, data, config, true);
			}
			return err.response;
		}
	},
}