const electron = require("electron");

electron.app.whenReady().then(function(){
	var win = new electron.BrowserWindow({
		webPreferences: {
			devTools: true,
			contextIsolation: false,
			nodeIntegration: true
		},
		width: 800,
		height: 600,
		title: "Dokkit - Dokkan Battle Bot",
		show: false,
		resizable: false,
		maximizable: false,
	});
	win.once("ready-to-show", function(){
		win.show();
	});
	win.setMenuBarVisibility(false);
	win.loadFile("src/index.html");
})