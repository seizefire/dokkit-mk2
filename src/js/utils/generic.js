module.exports = {
	/**
	 * @param {number} num 
	 */
	numberToByteSize(num){
		if(num < 1e3){
			return num + " B";
		}else if(num < 1e6){
			return (num / 1e3).toFixed(2) + " KB";
		}else if(num < 1e9){
			return (num / 1e6).toFixed(2) + " MB";
		}else{
			return (num / 1e9).toFixed(2) + " GB";
		}
	},
	/**
	 * @param {number} ms
	 */
	timeout(ms){
		return new Promise(function(resolve){
			setTimeout(function(){
				resolve();
			}, ms);
		});
	}
}