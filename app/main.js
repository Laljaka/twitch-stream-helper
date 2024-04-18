import { app, BrowserWindow, ipcMain, utilityProcess, dialog, Menu, MessageChannelMain } from 'electron/main'
import fsAsync from 'node:fs/promises'
import fsSync from 'node:fs'
import path from "node:path"
import { Module } from './resources/module.js'
import { createMainWindow, readStorageData, writeStorageData } from './resources/utility.js'

const __dir = path.join(process.cwd(), '/app')
const __moduledir = path.join(__dir, '/modules')

//Menu.setApplicationMenu(null)

/** @type {BrowserWindow} */
let mainWindow

/** @type {Electron.UtilityProcess} */
let communicator

const rawDir = await fsAsync.readdir(__moduledir, { withFileTypes: true })
const dirarr = rawDir.filter((dir) => dir.isDirectory()).map((dir) => dir.name)

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
    for (const key in modules) {
        st[key] = modules[key].storage
    writeStorageData(st)
    console.log('saved')
})


app.on('window-all-closed', () => console.log('all closed'))


app.whenReady().then(async () => {
    communicator = utilityProcess.fork(path.join(__dir, '/communicator.js'))   
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
    })
}).catch((err) => {
    console.error(err)
    app.quit()
})
