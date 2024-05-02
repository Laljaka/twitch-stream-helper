import { app, BrowserWindow, ipcMain, utilityProcess, dialog, Menu, MessageChannelMain } from 'electron/main'
import fsAsync from 'node:fs/promises'
import fsSync from 'node:fs'
import path from "node:path"
import { Component } from './resources/component.js'
import { createMainWindow, readStorageData, writeStorageData } from './resources/utility.js'

process.once('uncaughtException', (err) => {
    app.quit()
    throw err
})

const __dirname = app.getAppPath();
let __componentsdir = app.isPackaged ? path.join(process.resourcesPath, "components") : path.join(__dirname, 'components')


//Menu.setApplicationMenu(null)
/** @type {Electron.Rectangle} */
let mainBounds = { width: 800, height:600, x: 50, y: 50 }

/** @type {BrowserWindow} */
let mainWindow

/** @type {Electron.UtilityProcess} */
let communicator

const rawDir = await fsAsync.readdir(__componentsdir, { withFileTypes: true })
const dirarr = rawDir.filter((dir) => {
    return app.isPackaged ? dir.name.endsWith('.asar') : dir.isDirectory()
}).map((dir) => dir.name.endsWith('.asar') ? dir.name.slice(null, -5) : dir.name)

const initArray = []

/** @type {import('./shared_types.d.ts').Components} */
const components = dirarr.reduce((acc, cur) => {
    const ref = new Component(cur, __componentsdir)
    initArray.push(ref.initialise())
    acc[cur] = ref
    return acc
}, {})

const promiseArray = await Promise.allSettled(initArray)
for (const prom of promiseArray) {
    if (prom.status === 'rejected') {
        delete components[prom.reason]
    }
}

/** @type {import('./shared_types.d.ts').MultiComponentStorage} @readonly */
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
            if (key in components) components[key].bounds = parsed[key]
        }
    }
} catch (_) {
    
}


ipcMain.on('stdout', (_, from, args) => {
    mainWindow.webContents.send('stdout', from, args)
})

ipcMain.on('setUpChannelsReq', (ev, from) => {
    communicator.postMessage([from, components[from].data.type], ev.ports)
})

ipcMain.on('save', (_, from, key, data) => {
    components[from].setStorageKey(key, data)
})

ipcMain.on('state', (_, from, state) => {
    mainWindow.webContents.send('state', from, state)
})

ipcMain.on('main:start-component', (_, v) => {
    const context = components[v].createWindow()
    context.once('closed', () => { 
        if (mainWindow) mainWindow.webContents.send('state', v, false) 
    }).once('close', () => {
        context.hide()
    }).on('moved', () => {
        components[v].bounds = context.getBounds()
    }).on('resized', () => {
        components[v].bounds = context.getBounds()
    })
})

ipcMain.on('main:stop-component', (_, v) => {
    components[v].closeWindow()
})

ipcMain.handle('main:openFile', (_, options) => {
    return dialog.showOpenDialog(mainWindow, options)
})

ipcMain.handle('main:loadData', () => {
    const toSend = {}
    for (const key in components) {
        toSend[key] = {} 
        toSend[key]['displayName'] = components[key].data.displayName
        toSend[key]['storage'] = components[key].storage
        toSend[key]['html'] = components[key].html
    }
    return toSend
})

ipcMain.handle('main:ctx', (_, x, y, items) => {
    return new Promise((res, rej) => {
        const menu = Menu.buildFromTemplate([
            { role: 'copy' },
            { role: 'cut' },
            { role: 'paste' },
            { type: 'separator' },
            { label: 'Clear data',
                click: () => res('clear'),
                enabled: (items.includes("FORM"))? true : false },
            { label: "Clear ALL data",
                click: () => {
                    for (const key in components) {
                        components[key].setStorage({})
                    }
                    res('testing')
                    app.quit()
                },
                visible: !app.isPackaged },
            { role: 'toggleDevTools' }
        ])
        menu.popup({ window: mainWindow, x: x, y: y, callback: () => res('testing') })
    })
})

ipcMain.handle('main:getFileName', (_, pth) => {
    try {
        return path.basename(pth)
    } catch (error) {
        console.log(error)
        return "not a path"
    }
})


app.once('before-quit', (_) => {
    /** @type {import('./shared_types.d.ts').MultiComponentStorage} */
    const st = {}
    const config = {}
    config['mainWindow'] = mainBounds
    for (const key in components) {
        st[key] = components[key].storage
        config[key] = components[key].bounds
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
        if (key in components) components[key].setStorage(parsed[key])
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
