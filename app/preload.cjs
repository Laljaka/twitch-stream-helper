const { contextBridge, ipcRenderer } = require('electron/renderer')

const storage = JSON.parse(process.argv.slice(-1)[0])

contextBridge.exposeInMainWorld('mainApi', {
  storage: storage,
  startModule: (value) => ipcRenderer.invoke('main:start-module', value),
  stopModule: (value) => ipcRenderer.invoke("main:stop-module", value),
  toConsole: (value, callback) => {ipcRenderer.on(value, (ev, v) => callback(v))},
  save: (from, s) => ipcRenderer.send('save', from, s)
})