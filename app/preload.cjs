const { contextBridge, ipcRenderer } = require('electron/renderer')

const storage = JSON.parse(process.argv.slice(-1)[0])

contextBridge.exposeInMainWorld('mainApi', {
  storage: storage,
  startModule: (value) => ipcRenderer.invoke('main:start-module', value),
  stopModule: (value) => ipcRenderer.invoke("main:stop-module", value),
  toConsole: (callback) => {ipcRenderer.on('stdout', (_, from, v, state) => callback(from, v, state))},
  save: (from, s) => ipcRenderer.send('save', from, s),
  startModuleNew: (value) => ipcRenderer.send('main:start-module:new', value),
  stopModuleNew: (value) => ipcRenderer.send("main:stop-module:new", value),
  //stateUpdate: (callback) => { ipcRenderer.on('stateUpdate', (_, f, state) => callback(f, state)) } 
})