const { contextBridge, ipcRenderer } = require('electron/renderer')

const storage = JSON.parse(process.argv.slice(-1)[0]) as MultiModuleStorage

contextBridge.exposeInMainWorld('mainApi', {
  storage: storage,
  startModule: (value: ModuleName) => ipcRenderer.invoke('main:start-module', value),
  stopModule: (value: ModuleName) => ipcRenderer.invoke("main:stop-module", value),
  toConsole: (value: ModuleName, callback: Function) => {ipcRenderer.on(value, (ev, v: string) => callback(v))},
  save: (from: ModuleName, s: MultiModuleStorage) => ipcRenderer.send('save', from, s)
})