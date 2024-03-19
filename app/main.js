import { app, BrowserWindow, ipcMain, utilityProcess, safeStorage } from 'electron'
import fs from 'node:fs'
import path from "node:path"

/** @type {BrowserWindow} */
let mainWindow

const moduleMapping = {
    'twitchpubsub': createHiddenWindow,
    'renderer': createWindow,
    'http': createHiddenWindow,
    'elevenlabs': createWindow
} 


/** @type {import('./shared_types.d.ts').MultiModuleStorage} */
let storage = {
    twitchpubsub: {},
    renderer: {},
    http: {},
    elevenlabs: {}
}

/** @type {import('./shared_types.d.ts').Modules} */
const modules = {}

const __dirname = path.join(process.cwd(), '/app')
const __filepath = path.join(process.cwd(), '/content/storage.bin')

/**
 * 
 * @param {string} data 
 * @returns {BrowserWindow}
 */
function createMainWindow(data) {
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

/**
 * 
 * @param {import('./shared_types.d.ts').ModuleName} moduleName 
 * @returns {BrowserWindow}
 */
function createHiddenWindow(moduleName) {
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

/**
 * 
 * @param {import('./shared_types.d.ts').ModuleName} moduleName 
 * @returns {BrowserWindow}
 */
function createWindow(moduleName) {
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

/**
 * 
 * @returns {Promise<string>}
 */
function readData() {
    return new Promise((res, rej) => {
        fs.readFile(__filepath, (err1, data) => {
            if (err1) {
                //process.exit(1)
                fs.open(__filepath, 'w', (err2, fd) => {
                    if (err2) rej(`Could not open the old file nor create a new one -- ${err1} + ${err2}`)
                    else {
                        fs.writeSync(fd, safeStorage.encryptString(JSON.stringify(storage)))
                        fs.closeSync(fd)
                        res(JSON.stringify(storage))
                    }
                })
            } else {
                try {
                    const decrypted = safeStorage.decryptString(data)
                    res(decrypted)
                } catch (err) {
                    console.log(err)
                    fs.writeFileSync(__filepath, safeStorage.encryptString(JSON.stringify(storage)))
                    res(JSON.stringify(storage))
                }
                
            }
        })
    })
}

/**
 * 
 * @param {import('./shared_types.d.ts').ModuleName} moduleName 
 */
function registerModule(moduleName) {
    ipcMain.on(`${moduleName}:readyState`, (_, args) => {
        mainWindow.webContents.send(`${moduleName}:readyState`, args)
    })

    
}

/**
 * 
 * @param {import('./shared_types.d.ts').MultiModuleStorage} d 
 * @returns {Promise<void>}
 */
function writeData(d) {
    return new Promise((res, rej) => {
        fs.writeFile(__filepath, safeStorage.encryptString(JSON.stringify(d)), (err) => {
            if (err) rej('How?')
            else res()
        })
    })
}

/*
ipcMain.on('data', (_event, value) => {
    const ref = modules[value.to] 
    if (ref) ref.webContents.send('instruction', value.instruction)
})*/

ipcMain.on('stdout', (_, from, args, state) => {
    mainWindow.webContents.send('stdout', from, args, state)
})

ipcMain.on('save', (ev, from, data) => {
    storage[from] = data
})

// TODO try packing this into stdout


ipcMain.handle('main:start-module', (_e, v) => {
    return new Promise(function(resolve, reject) {
        modules[v] = moduleMapping[v](v)
        modules[v].once('closed', () => delete modules[v])
        modules[v].once('ready-to-show', () => resolve())
    })
})

ipcMain.on('main:start-module:new', (_, v) => {
    modules[v] = moduleMapping[v](v)
    modules[v].once('closed', () => delete modules[v])
})

ipcMain.on('main:stop-module:new', (_, v) => {
    if (v in modules) modules[v].webContents.send('close')
})

ipcMain.handle("main:stop-module", (_e, v) => {
    return new Promise(function(resolve, reject) {
        if (v in modules) {
            modules[v].once('closed', () => resolve())
            modules[v].webContents.send('close')
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
