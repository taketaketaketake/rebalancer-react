import { app, BrowserWindow } from "electron";
import { enableLiveReload } from 'electron-compile';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

let mainWindow: Electron.BrowserWindow

const isDevMode = process.execPath.match(/[\\/]electron/);

if (isDevMode) {
    enableLiveReload({ strategy: 'react-hmr' });
}

app.on('ready', async () => {
    mainWindow = new BrowserWindow({
        titleBarStyle: 'hiddenInset',
        webPreferences: {
            nodeIntegration: true,
        },
    })

    // Open the DevTools.
    if (isDevMode) {
        await installExtension(REACT_DEVELOPER_TOOLS);
        mainWindow.webContents.openDevTools();
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.loadURL(`file://${__dirname}/index.html`);
})
