import { app, BrowserWindow, ipcMain, utilityProcess } from 'electron'

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

let storage: MultiModuleStorage

const modules: Modules = {}

async function createMainWindow(data: string) {
    const win = new BrowserWindow({
        width: 800,
        minWidth: 700,
        height: 600,
        minHeight: 550,
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            additionalArguments: [data]
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
            preload: path.join(__dirname, `modules/${moduleName}/${moduleName}.preload.js`)
        }
    })
    await win.loadFile(path.join(__dirname, `modules/${moduleName}/${moduleName}.html`))
    return win
}

async function readData() {
    const proc = utilityProcess.fork(path.join(__dirname, 'data.js'), ['password', 'read'])
    return new Promise<string>((resolve, reject) => {
        let s: string | undefined
        proc.once('message', (msg: string) => {
            s = msg
        })
        proc.once('exit', (code) => {
            if (code === 0 && s) resolve(s)
            else if (code === 1) reject('There was an error reading a file')
            else if (code === 2) reject('Somehow no work was done, something terrible has happened...')
            else reject('Process exited gracefully but data was never there... WHAT')
        })
    })
}

async function writeData(d: MultiModuleStorage) {
    const proc = utilityProcess.fork(path.join(__dirname, 'data.js'), ['password', 'write', JSON.stringify(d)])
    return new Promise<void>((resolve, reject) => {
        proc.once('exit', (code) => {
            if (code === 0) resolve()
            else if (code === 1) reject('There was an error writing a file')
            else if (code === 2) reject('Somehow no work was done, something terrible has happened...')
        })
    })
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
    const temporary = await readData()
    storage = JSON.parse(temporary) 
    mainWindow = await createMainWindow(temporary)
}).catch((err) => {
    app.quit()
    console.error(err)
})

