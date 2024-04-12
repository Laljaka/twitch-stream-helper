import { app, BrowserWindow, ipcMain, utilityProcess, safeStorage, dialog, Menu } from 'electron'
import fs from 'node:fs'
import path from "node:path"
import { Module, createMainWindow } from './resources/module.js'
import { MessageChannelMain } from 'electron/main'

const __dir = path.join(process.cwd(), '/app')
const __moduledir = path.join(__dir, '/modules')
const __filepath = path.join(process.cwd(), '/content/storage.bin')

//Menu.setApplicationMenu(null)

/** @type {BrowserWindow} */
let mainWindow

/** @type {Electron.UtilityProcess} */
let communicator

const dirarr = fs.readdirSync(__moduledir, { withFileTypes: true })
    .filter((dir) => dir.isDirectory())
    .map((dir) => dir.name)

const initArray = []

/** @type {import('./shared_types.d.ts').Modules} */
const modules = dirarr.reduce((acc, cur) => {
    const ref = new Module(cur)
    initArray.push(ref.initialise())
    acc[cur] = ref
    return acc
}, {})

const promiseArray = await Promise.allSettled(initArray)
for (const prom of promiseArray) {
    if (prom.status === 'rejected') {
        delete modules[prom.reason]
    }
}

/** @type {import('./shared_types.d.ts').MultiModuleStorage} @readonly */
const storageDefaults = dirarr.reduce((acc, cur) => {
    acc[cur] = {}
    return acc
}, {})

/**
 * @param {import('./shared_types.d.ts').MultiModuleStorage} defaults 
 * @returns {Promise<import('./shared_types.d.ts').MultiModuleStorage>}
 */
function readData(defaults) {
    return new Promise((res, rej) => {
        fs.readFile(__filepath, (err1, data) => {
            if (err1) {
                fs.open(__filepath, 'w', (err2, fd) => {
                    if (err2) rej(`Could not open the old file nor create a new one -- ${err1} + ${err2}`)
                    else {
                        fs.writeSync(fd, safeStorage.encryptString(JSON.stringify(defaults)))
                        fs.closeSync(fd)
                        res(defaults)
                    }
                })
            } else {
                try {
                    const decrypted = safeStorage.decryptString(data)
                    res(JSON.parse(decrypted))
                } catch (err) {
                    console.log(err)
                    fs.writeFileSync(__filepath, safeStorage.encryptString(JSON.stringify(defaults)))
                    res(defaults)
                }
                
            }
            console.log('read the file')
        })
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

ipcMain.on('stdout', (_, from, args) => {
    mainWindow.webContents.send('stdout', from, args)
})

ipcMain.on('setUpChannelsReq', (ev, from) => {
    const { port1, port2 } = new MessageChannelMain()
    communicator.postMessage(from, [port1])
    ev.sender.postMessage('setUpChannelsResp', null, [port2])
})

ipcMain.on('save', (_, from, key, data) => {
    modules[from].setStorageKey(key, data)
})

ipcMain.on('state', (_, from, state) => {
    mainWindow.webContents.send('state', from, state)
})

ipcMain.on('main:start-module', (_, v) => {
    modules[v].createWindow()
        .once('closed', () => { if (mainWindow) mainWindow.webContents.send('state', v, false) })
})

ipcMain.on('main:stop-module', (_, v) => {
    modules[v].closeWindow()
})

ipcMain.handle('main:openFile', (_, options) => {
    return dialog.showOpenDialog(mainWindow, options)
})

ipcMain.handle('main:loadData', () => {
    const toSend = {}
    for (const key in modules) {
        toSend[key] = {} 
        toSend[key]['displayName'] = modules[key].data.displayName
        toSend[key]['storage'] = modules[key].storage
        toSend[key]['html'] = modules[key].html
    }
    return toSend
})

ipcMain.handle('main:ctx', (_, x, y, items) => {
    return new Promise((res, rej) => {
        const menu = Menu.buildFromTemplate([
            {   role: 'copy' },
            {   role: 'cut' },
            {   role: 'paste' },
            {   type: 'separator' },
            {   label: 'Clear data',
                    click: () => res('clear'),
                    enabled: (items.includes("FORM"))? true : false },
            {   role: 'toggleDevTools' }
        ])
        menu.popup({ window: mainWindow, x: x, y: y, callback: () => res('testing') })
    })
})


app.once('before-quit', async (ev) => {
    ev.preventDefault()
    /** @type {import('./shared_types.d.ts').MultiModuleStorage} */
    const st = {}
    for (const key in modules) {
        st[key] = modules[key].storage
    }
    await writeData(st)
    app.quit()
})


app.on('window-all-closed', () => console.log('all closed'))


app.whenReady().then(async () => {
    communicator = utilityProcess.fork(path.join(__dir, '/communicator.js'))   


    console.log('ready')
    const parsed = await readData(storageDefaults)
    for (const key in parsed) {
        if (key in modules) modules[key].setStorage(parsed[key])
    }
    
    mainWindow = createMainWindow()
    mainWindow.once('closed', () => {
        mainWindow = null
        app.quit()
    })
}).catch((err) => {
    console.error(err)
    app.quit()
})
