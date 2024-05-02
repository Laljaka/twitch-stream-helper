const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('mainApi', {
    loadData: () => ipcRenderer.invoke('main:loadData'),
    toConsole: (callback) => { ipcRenderer.on('stdout', (_, from, v) => callback(from, v)) },
    save: (from, key, value) => ipcRenderer.send('save', from, key, value),
    controlComponent: (start, value) => start? ipcRenderer.send('main:start-component', value) : ipcRenderer.send('main:stop-component', value),
    stateUpdate: (callback) => { ipcRenderer.on('state', (_, f, state) => callback(f, state)) },
    openFile: (options) => ipcRenderer.invoke('main:openFile', options),
    openContext: (x, y, i) => ipcRenderer.invoke('main:ctx', x, y, i),
    getFileName: (str) => ipcRenderer.invoke('main:getFileName', str)
})