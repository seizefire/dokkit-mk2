var progressTask = document.getElementById("queue-task");
var progressMission = document.getElementById("queue-mission");
var progressBar = document.getElementById("queue-progress");
var progressText = document.getElementById("queue-progress-text");

var dots = 0;
var task = "";
var queue = [];
var running = false;

async function startQueue(){
	running = true;
	while(queue.length > 0){
		let element = queue.shift();
		let response = element();
		if(response instanceof Promise){
			await response;
		}
	}
	running = false;
}

setInterval(function(){
	if(task == ""){
		return;
	}
	dots = (dots + 1) % 4;
	progressTask.innerText = task + ".".repeat(dots);
}, 500);

module.exports = {
	enqueue(executor){
		queue.push(executor);
		if(!running){
			startQueue();
		}
	},
	/**
	 * @param {string} text 
	 */
	setMission(text){
		progressMission.innerText = text;
	},
	/**
	 * @param {string} text 
	 */
	setTask(text){
		if(task == text){
			return;
		}
		dots = 0;
		task = text;
		progressTask.innerText = text == "" ? "Idle" : text;
	},
	/**
	 * @param {number} value 
	 * @param {number} min 
	 * @param {number} max 
	 * @param {string} text 
	 */
	setProgress(value, min, max, text){
		if(value === ""){
			progressBar.removeAttribute("value");
		}else{
			progressBar.setAttribute("value", value);
		}
		progressBar.setAttribute("min", min);
		progressBar.setAttribute("max", max);
		progressText.innerText = text;
	}
}