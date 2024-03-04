import { app, BrowserWindow, ipcMain, utilityProcess } from 'electron'

import path from "node:path"

let mainWindow: BrowserWindow | undefined

const moduleMapping = {
    'twitchpubsub': createHiddenWindow,
    'renderer': createWindow,
    'http': createHiddenWindow,
    'elevenlabs': createWindow
} as const 

type Modules = {
    [key in ModuleName]?: BrowserWindow
}

let storage: MultiModuleStorage

const modules: Modules = {}

const __dirname = path.join(process.cwd(), '/dist')

function createMainWindow(data: string) {
    const win = new BrowserWindow({
        width: 800,
        minWidth: 700,
        height: 600,
        minHeight: 550,
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            additionalArguments: [data]
        }
    })

    win.loadFile(path.join(__dirname, 'index.html'))

    win.once('closed', () => app.quit())

    win.once('ready-to-show', () => win.show())

    return win
}

function createHiddenWindow(moduleName: ModuleName) {
    const win = new BrowserWindow({
        width: 200,
        height: 200,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            additionalArguments: [JSON.stringify(storage[moduleName])]
        }
    })

    win.loadFile(path.join(__dirname, `modules/${moduleName}/${moduleName}.html`))

    return win
}

function createWindow(moduleName: ModuleName) {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            //nodeIntegration: true,
            //contextIsolation: false,
            preload: path.join(__dirname, `modules/${moduleName}/${moduleName}.preload.cjs`),
            //preload: path.join(__dirname, `modules/${moduleName}/${moduleName}.preload.js`),
            additionalArguments: [JSON.stringify(storage[moduleName])]
        }
    })

    win.loadFile(path.join(__dirname, `modules/${moduleName}/${moduleName}.html`))

    win.once('ready-to-show', () => win.show())
    
    return win
}

function readData() {
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

function writeData(d: MultiModuleStorage) {
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
    const ref = modules[value.to]
    if (ref) ref.webContents.send('instruction', value.instruction)
})

ipcMain.on('stdout', (_, value: StdOut) => {
    if (mainWindow) mainWindow.webContents.send(value.from, value.data)
})

ipcMain.on('save', (ev, from: ModuleName, data: ModuleStorage) => {
    storage[from] = data
    writeData(storage)
})

ipcMain.handle('main:start-module', (_e, v: ModuleName) => {
    return new Promise<void>(function(resolve, reject) {
        modules[v] = moduleMapping[v](v)
        modules[v]!.once('closed', () => delete modules[v])
        modules[v]!.once('ready-to-show', () => resolve())
    })
})

ipcMain.handle("main:stop-module", (_e, v: ModuleName) => {
    return new Promise<void>(function(resolve, reject) {
        if (v in modules) {
            modules[v]!.once('closed', () => resolve())
            modules[v]!.webContents.send('close')
        } else resolve()
    })
})

app.whenReady().then(async () => {
    const temporary = await readData()
    storage = JSON.parse(temporary) 
    mainWindow = createMainWindow(temporary)
}).catch((err) => {
    app.quit()
    console.error(err)
})
