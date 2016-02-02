/// <reference path="./typings/tsd.d.ts" />
import {BrowserWindow, app} from 'electron';

var mainWindow: GitHubElectron.BrowserWindow = null;

app.on('window-all-closed', onWindowAllClosed);
app.on('ready', onReady);

function onWindowAllClosed(): void {
    if (process.platform != 'darwin') {
        app.quit();
    }
}

function onReady(): void {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600
    });

    mainWindow.loadURL('file://' + __dirname + '/index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
