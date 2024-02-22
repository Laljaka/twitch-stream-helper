import { app, BrowserWindow, ipcMain } from 'electron'

import path from "node:path"

import fs from "fs"

let mainWindow = -1

const moduleMapping = {
    'twitchpubsub': createHiddenWindow,
    'renderer': createSecureHiddenWindow,
    'http': createHiddenWindow,
    'elevenlabs': createSecureHiddenWindow
} as const

const modules = {
    'twitchpubsub': -1,
    'renderer': -1,
    'http': -1,
    'elevenlabs': -1
}

function createMainWindow() {
    const win = new BrowserWindow({
        width: 800,
        minWidth: 700,
        height: 600,
        minHeight: 550,
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile(path.join(__dirname, 'index.html'))

    win.once('ready-to-show', () => {
        win.show()
    })

    win.once('closed', () => {
        app.quit()
    })
    return win
}

function createHiddenWindow(moduleName: string) {
    const win = new BrowserWindow({
        width: 200,
        height: 200,
        show: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    win.loadFile(path.join(__dirname, `modules/${moduleName}/${moduleName}.html`))
    return win
}

function createSecureHiddenWindow(moduleName: string) {
    const win = new BrowserWindow({
        width: 200,
        height: 200,
        show: true,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, `modules/${moduleName}/preload_${moduleName}.js`)
        }
    })
    win.loadFile(path.join(__dirname, `modules/${moduleName}/${moduleName}.html`))
    return win
}

ipcMain.on('data', (_event, value: Data) => {
    console.log(value)
})

ipcMain.handle('main:start-module', (_e, v: ModuleName) => {
    console.log('opening process')
    modules[v] = moduleMapping[v](v).id
    const ref = BrowserWindow.fromId(modules[v])
    return new Promise<void>(function(resolve, reject) {
        if (ref) {
            ref.once('ready-to-show', () => {
                resolve()
            })
        } else {
            reject('No such window exists')
        }
        
    })
})

ipcMain.handle("main:stop-module", (_e, v: ModuleName) => {
    const ref = BrowserWindow.fromId(modules[v])
    return new Promise<void>(function(resolve, reject) {
        if (ref) {
            ref.once('closed', () => {
                console.log('process closed, removing instances')
                modules[v] = -1
                resolve()
            })
            console.log('sending close to process')
            ref.webContents.send('close')
        } else {
            modules[v] = -1
            resolve()
        }
        
        
    })
    
})

app.whenReady().then(() => {
    mainWindow = createMainWindow().id
})

