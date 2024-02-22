import { app, BrowserWindow, ipcMain } from 'electron'

import path from "node:path"

import fs from "fs"

let mainWindow: BrowserWindow | null = null

const moduleMapping = {
    'twitchpubsub': createHiddenWindow,
    'renderer': createSecureHiddenWindow,
    'http': createHiddenWindow,
    'elevenlabs': createSecureHiddenWindow
} as const

type Modules = {
    [key: string]: BrowserWindow
}

const modules: Modules = {}

async function createMainWindow() {
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

    await win.loadFile(path.join(__dirname, 'index.html'))
    win.show()

    win.once('closed', () => {
        mainWindow = null
        app.quit()
    })
    return win
}

async function createHiddenWindow(moduleName: string) {
    const win = new BrowserWindow({
        width: 200,
        height: 200,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    await win.loadFile(path.join(__dirname, `modules/${moduleName}/${moduleName}.html`))
    return win
}

async function createSecureHiddenWindow(moduleName: string) {
    const win = new BrowserWindow({
        width: 200,
        height: 200,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, `modules/${moduleName}/preload_${moduleName}.js`)
        }
    })
    await win.loadFile(path.join(__dirname, `modules/${moduleName}/${moduleName}.html`))
    return win
}

ipcMain.on('data', (_event, value: Data) => {
    modules[value.to].webContents.send('instruction', value.instruction)
})

ipcMain.on('stdout', (_, value: StdOut) => {
    if (mainWindow) mainWindow.webContents.send(value.from, value.data)
})

ipcMain.handle('main:start-module', async (_e, v: ModuleName) => {
    modules[v] = await moduleMapping[v](v)
    modules[v].once('closed', () => delete modules[v])
    return new Promise<void>(function(resolve, reject) {
        if (v in modules) {
            modules[v].once('ready-to-show', () => resolve())
        } else reject('No such window exists')
    })
})

ipcMain.handle("main:stop-module", (_e, v: ModuleName) => {
    return new Promise<void>(function(resolve, reject) {
        if (v in modules) {
            modules[v].once('closed', () => resolve())
            modules[v].webContents.send('close')
        } else resolve()
    })
})


app.whenReady().then(async () => {
    mainWindow = await createMainWindow()
})

