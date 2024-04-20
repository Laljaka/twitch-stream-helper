import { app, BrowserWindow, ipcMain, utilityProcess, dialog, Menu, MessageChannelMain } from 'electron/main'
import fsAsync from 'node:fs/promises'
import fsSync from 'node:fs'
import path from "node:path"
import { Module } from './resources/module.js'
import { createMainWindow, readStorageData, writeStorageData } from './resources/utility.js'

process.once('uncaughtException', (err) => {
    app.quit()
    throw err
})

const __dirname = app.getAppPath();
let __moduledir = app.isPackaged ? path.join(process.resourcesPath, "modules") : path.join(__dirname, 'modules')


//Menu.setApplicationMenu(null)
/** @type {Electron.Rectangle} */
let mainBounds = { width: 800, height:600, x: 50, y: 50 }

/** @type {BrowserWindow} */
let mainWindow

/** @type {Electron.UtilityProcess} */
let communicator

const rawDir = await fsAsync.readdir(__moduledir, { withFileTypes: true })
const dirarr = rawDir.filter((dir) => {
    return app.isPackaged ? dir.name.endsWith('.asar') : dir.isDirectory()
}).map((dir) => dir.name.endsWith('.asar') ? dir.name.slice(null, -5) : dir.name)

const initArray = []

/** @type {import('./shared_types.d.ts').Modules} */
const modules = dirarr.reduce((acc, cur) => {
    const ref = new Module(cur, __moduledir)
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

try {
    const configData = await fsAsync.readFile(path.join(app.getPath('userData'), 'config.json'), 'utf-8')
    const parsed = JSON.parse(configData)
    for (const key in parsed) {
        if (key === 'mainWindow') {
            mainBounds = parsed[key]
        } else {
            if (key in modules) modules[key].bounds = parsed[key]
        }
    }
} catch (_) {
    
}


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
    const context = modules[v].createWindow()
    context.once('closed', () => { 
        if (mainWindow) mainWindow.webContents.send('state', v, false) 
    }).once('close', () => {
        context.hide()
    }).on('moved', () => {
        modules[v].bounds = context.getBounds()
    }).on('resized', () => {
        modules[v].bounds = context.getBounds()
    })
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


app.once('before-quit', (_) => {
    /** @type {import('./shared_types.d.ts').MultiModuleStorage} */
    const st = {}
    const config = {}
    config['mainWindow'] = mainBounds
    for (const key in modules) {
        st[key] = modules[key].storage
        config[key] = modules[key].bounds
    }
    writeStorageData(st)

    fsSync.writeFileSync(path.join(app.getPath('userData'), 'config.json'), JSON.stringify(config), 'utf-8')
    
    console.log('saved')
})


app.on('window-all-closed', () => console.log('all closed'))


app.whenReady().then(async () => {
    //const { screen } = await import('electron/main')
    //console.log(screen.getAllDisplays(), screen.getPrimaryDisplay())
    communicator = utilityProcess.fork(path.join(__dirname, '/communicator.js'))   
    communicator.once('exit', (code) => {
        if (mainWindow) {
            console.log('window still exists, process most likely crashed, closing...', code)
            app.quit()
        }
    })

    console.log('ready')
    const parsed = await readStorageData(storageDefaults)
    for (const key in parsed) {
        if (key in modules) modules[key].setStorage(parsed[key])
    }
    
    mainWindow = createMainWindow(mainBounds).once('closed', () => {
        mainWindow = null
        app.quit()
    }).on('moved', () => {
        mainBounds = mainWindow.getBounds()
    }).on('resized', () => {
        mainBounds = mainWindow.getBounds()
    })
}).catch((err) => {
    console.error(err)
    app.quit()
})
