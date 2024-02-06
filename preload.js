const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('api', {
  startModule: (value) => ipcRenderer.send('main:start-module', value),
  stopModule: (value) => ipcRenderer.send("main:stop-module", value)
})