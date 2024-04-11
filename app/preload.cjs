const { contextBridge, ipcRenderer } = require('electron/renderer')


contextBridge.exposeInMainWorld('mainApi', {
    loadData: () => ipcRenderer.invoke('main:loadData'),
    toConsole: (callback) => {ipcRenderer.on('stdout', (_, from, v) => callback(from, v))},
    save: (from, key, value) => ipcRenderer.send('save', from, key, value),
    startModule: (value) => ipcRenderer.send('main:start-module', value),
    stopModule: (value) => ipcRenderer.send("main:stop-module", value),
    stateUpdate: (callback) => { ipcRenderer.on('state', (_, f, state) => callback(f, state)) },
    openFile: (options) => ipcRenderer.invoke('main:openFile', options),
    openContext: (x, y, i) => ipcRenderer.invoke('main:ctx', x, y, i)
})