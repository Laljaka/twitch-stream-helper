const { app, BrowserWindow, ipcMain, utilityProcess } = require('electron')

const path = require("node:path")

const fs = require("fs")

const modules = {}

function createMainWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('index.html')

    win.on('closed', () => {
        app.quit()
    })
    return win
}

function createHiddenWindow(moduleName) {
    const win = new BrowserWindow({
        width: 200,
        height: 200,
        show: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    win.loadFile(`modules/${moduleName}/${moduleName}.html`)
    return win
}

function createSecureHiddenWindow(moduleName) {
    const win = new BrowserWindow({
        width: 200,
        height: 200,
        show: true,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, `modules/${moduleName}/preload_${moduleName}.js`)
        }
    })
    win.loadFile(`modules/${moduleName}/${moduleName}.html`)
}

function createUtilityProcess(moduleName) {
    return utilityProcess.fork(path.join(__dirname, `modules/${moduleName}/${moduleName}.js`))
}

ipcMain.on('websocket', (_event, value) => {
        if (value.type === "data") {
            console.log(value)
        } else {
            console.log(value.message)
        }
})

ipcMain.on('main:start-module', async (_e, v) => {
    console.log('opening process')
    modules[v] = createHiddenWindow(v)
    modules[v].once('closed', () => {
        console.log('process closed, removing instances')
        ipcMain.removeAllListeners(v)
        delete modules[v]
    })
    ipcMain.on(v, (_e, v) => {
        console.log(v)
    })
})

ipcMain.on("main:stop-module", async (_e, v) => {
    console.log('sending close to process')
    modules[v].webContents.send('close')
})

app.whenReady().then(() => {
    const mainWindow = createMainWindow()

})

