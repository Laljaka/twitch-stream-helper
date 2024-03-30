const { contextBridge, ipcRenderer } = require('electron/renderer')


const imp = process.argv.slice(-1)

const displayNames = JSON.parse(imp[0])


contextBridge.exposeInMainWorld('mainApi', {
    data: displayNames,
    toConsole: (callback) => {ipcRenderer.on('stdout', (_, from, v) => callback(from, v))},
    save: (from, key, value) => ipcRenderer.send('save', from, key, value),
    startModule: (value) => ipcRenderer.send('main:start-module', value),
    stopModule: (value) => ipcRenderer.send("main:stop-module", value),
    stateUpdate: (callback) => { ipcRenderer.on('state', (_, f, state) => callback(f, state)) } 
})