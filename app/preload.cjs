const { contextBridge, ipcRenderer } = require('electron/renderer')

let storage
const imp = process.argv.slice(-2)
try {
    storage = JSON.parse(imp[1])
} catch (error) {
    window.close()
}
console.log(imp[0])


contextBridge.exposeInMainWorld('mainApi', {
    storage: storage,
    toConsole: (callback) => {ipcRenderer.on('stdout', (_, from, v) => callback(from, v))},
    save: (from, key, value) => ipcRenderer.send('save', from, key, value),
    startModule: (value) => ipcRenderer.send('main:start-module', value),
    stopModule: (value) => ipcRenderer.send("main:stop-module", value),
    stateUpdate: (callback) => { ipcRenderer.on('state', (_, f, state) => callback(f, state)) } 
})