const { contextBridge, ipcRenderer } = require('electron/renderer')

let storage
try {
    storage = JSON.parse(process.argv.slice(-1)[0])
} catch (error) {
    window.close()
}


contextBridge.exposeInMainWorld('mainApi', {
    storage: storage,
    toConsole: (callback) => {ipcRenderer.on('stdout', (_, from, v) => callback(from, v))},
    save: (from, s) => ipcRenderer.send('save', from, s),
    startModule: (value) => ipcRenderer.send('main:start-module', value),
    stopModule: (value) => ipcRenderer.send("main:stop-module", value),
    stateUpdate: (callback) => { ipcRenderer.on('state', (_, f, state) => callback(f, state)) } 
})