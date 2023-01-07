// Modules to control application life and create native browser window
const {app, BrowserWindow, webFrame,globalShortcut, shell } = require('electron')
const path = require('path')
const os = require('os');
const WebSocket = require('ws');
var myip = require('quick-local-ip');
const { autoUpdater } = require('electron-updater');


let addressFinal=''
let myAddress=''
let mainWindow;
let ws;
function initWS(){
	 ws = new WebSocket('ws://'+addressFinal+':3000');

ws.on('open', function open() {
  console.log('ws open');
});
ws.on("error", (err) =>{
    console.log("Caught flash policy server socket error: ")
    console.log(err.stack)
	ws.close();
})
ws.on("close",(e)=>{
	setTimeout(function(){
		initWS();
	},1000);
	
})
ws.on('message', function incoming(data) {
	console.log(data)
	let obj = JSON.parse(data);
	if(obj.action=='reloadApp' && obj.data.ip == myAddress){
		app.relaunch()
		app.exit()
	}
	if(obj.action =='openConsole' && obj.data.ip == myAddress){
	  mainWindow.webContents.openDevTools()
	}
	if(obj.action =='closeConsole' && obj.data.ip == myAddress){
	  mainWindow.webContents.closeDevTools()
	}
	if(obj.action =='clearCache' && obj.data.ip == myAddress){
	  const ses = mainWindow.webContents.session
			  ses.clearCache().then(data=>{
				  console.log("vide")
				  app.relaunch()
				  app.exit()
			  })
	}

});
}
function createWindow () {
  //

  // Create the browser window.
  mainWindow = new BrowserWindow({
	 icon: __dirname + '/favicon.ico',
	 webPreferences: { worldSafeExecuteJavaScript: false, contextIsolation: false , zoomFactor: 1.0},
	 show: false,
    //width: 800,
    //height: 600,
    //webPreferences: {
    //  preload: path.join(__dirname, 'preload.js')
    //}
  })
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
var interfaces = os.networkInterfaces();
var addresse = '';
 //for(var k in interfaces['Ethernet']){
	 var interf=interfaces['Ethernet']
 for(var k in interf){
	 var address = interf[k];
	if (address.family === 'IPv4' && !address.internal) {
		addresse=address.address;
		myAddress=addresse
	}
 }
if(addresse == ''){
	interf=interfaces['Wi-Fi']
	for(var k in interf){
	 var address = interf[k];
	if (address.family === 'IPv4' && !address.internal) {
		addresse=address.address;
		myAddress=addresse
	}
 }
}
if(addresse == ''){
	addresse=myip.getLocalIP4();
		myAddress=myip.getLocalIP4()
}
	var addresseSplit=addresse.split('.')
	addresseSplit.pop();
	addresseSplit.push('3');
	addressFinal=addresseSplit.join('.')
  // and load the index.html of the app.
  //mainWindow.loadFile('index.html')
    mainWindow.setFullScreen(true);
	mainWindow.loadURL('http://'+addressFinal+'/application/start')
	mainWindow.setMenu(null)
	 var bounds = mainWindow.getBounds()
	 var zoom=1
	if(bounds.width == 768 && bounds.height == 1366){
		zoom=0.75
	}
	mainWindow.once("ready-to-show", () => {
		autoUpdater.checkForUpdatesAndNotify();
		mainWindow.webContents.setZoomFactor(zoom);
		mainWindow.show();
	});
	
	 mainWindow.webContents.once("did-finish-load", function () {
        var http = require("http");
        const url = require("url");
        var server = http.createServer(function (req, res) {
             // Set our header
    res.setHeader("Access-Control-Allow-Origin", "*")
    // Parse the request url
    const parsed = url.parse(req.url, true)
    // Get the path from the parsed URL
    const reqUrl = parsed.pathname
    // Compare our request method
    if (req.method == "GET") {
        if (reqUrl == "/") {
            // Send a JSON version of our URL query
            res.write("BowlingApplication" +  JSON.stringify(parsed.query))
            res.end()
        }
		if(reqUrl=="/restart"){
			app.relaunch()
			app.exit()
			res.write("restart ok")
            res.end()
		}
		if(reqUrl=="/openConsole"){
			mainWindow.webContents.openDevTools()
			res.write("open console ok")
            res.end()
		}
		if(reqUrl=="/closeConsole"){
			mainWindow.webContents.closeDevTools()
			res.write("close console ok")
            res.end()
		}
		if(reqUrl=="/clearCache"){
			const ses = mainWindow.webContents.session
			  ses.clearCache().then(data=>{
				  console.log("vide")
				  app.relaunch()
				  app.exit()
			  })
			res.write("clear cache ok")
            res.end()
		}
		if(reqUrl=="/ip"){
			res.write("ip:"+myip.getLocalIP4())
			res.end()
		}
		if(reqUrl=="/nepting/start"){
			shell.openPath('C:\\Nepting\\nepting.bat');
			res.write("Neptin start ok")
            res.end()
		}
		if(reqUrl=="/version"){
			res.write("Version:"+app.getVersion())
            res.end()
		}
    } else if (req.method == "POST") {
        if (reqUrl == "/hello") {
            res.write("hello world")
            res.end()
        }
	
	}
        });
        server.listen(3333);
        console.log("http://localhost:3333/");
    });
  //mainWindow.maximize();
   
  // Open the DevTools.
  	  //mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	try{
		globalShortcut.register('shift+CommandOrControl+I', () => {
			//console.log('Electron loves global shortcuts!')
			mainWindow.webContents.openDevTools()
		  })
		createWindow()
		
		// Upper Limit is working of 500 % 
		console.log('fini creation window')
		//initWS();
  
		  app.on('activate', function () {
			// On macOS it's common to re-create a window in the app when the
			// dock icon is clicked and there are no other windows open.
			if (BrowserWindow.getAllWindows().length === 0) createWindow()
		  })
	} catch (error) {
		console.error(error);
		app.relaunch()
		app.exit()
	  // expected output: ReferenceError: nonExistentFunction is not defined
	  // Note - error messages will vary depending on browser
	}
})


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
autoUpdater.on('update-available', () => {
	console.log("updateAvailable")
  mainWindow.webContents.send('update_available');
});
autoUpdater.on('update-downloaded', () => {
	console.log("updateDowloaded")
  mainWindow.webContents.send('update_downloaded');
  autoUpdater.quitAndInstall();
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
