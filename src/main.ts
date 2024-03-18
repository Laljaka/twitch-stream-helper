import { app, BrowserWindow, ipcMain, utilityProcess, safeStorage } from 'electron'
import fs from 'node:fs'
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
const __filepath = path.join(process.cwd(), 'content/storage.bin')

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
    return new Promise<string>((res, rej) => {
        fs.readFile(__filepath, (err1, data) => {
            if (err1) {
                //process.exit(1)
                fs.open(__filepath, 'w', (err2, fd) => {
                    if (err2) rej(`Could not open the old file nor create a new one -- ${err1} + ${err2}`)
                    else {
                        fs.writeSync(fd, safeStorage.encryptString(JSON.stringify({})))
                        fs.closeSync(fd)
                        res(JSON.stringify({}))
                    }
                })
            } else {
                res(safeStorage.decryptString(data))
            }
        })
    })
}

function writeData(d: MultiModuleStorage) {
    return new Promise<void>((res, rej) => {
        fs.writeFile(__filepath, safeStorage.encryptString(JSON.stringify(d)), (err) => {
            if (err) rej('How?')
            else res()
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

app.once('before-quit', async (ev) => {
    ev.preventDefault()
    await writeData(storage)
    app.quit()
})


app.on('window-all-closed', () => console.log('all closed'))






app.whenReady().then(async () => {
    const temporary = await readData()
    storage = JSON.parse(temporary) 
    mainWindow = createMainWindow(temporary)
}).catch((err) => {
    console.error(err)
    app.quit()
    
})
