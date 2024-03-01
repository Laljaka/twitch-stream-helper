import { CallbackResponse } from 'electron'
import { contextBridge, ipcRenderer } from 'electron/renderer'

const storage = JSON.parse(process.argv.slice(-1)[0]) as MultiModuleStorage

contextBridge.exposeInMainWorld('api', {
  storage: storage,
  startModule: (value: ModuleName) => ipcRenderer.invoke('main:start-module', value),
  stopModule: (value: ModuleName) => ipcRenderer.invoke("main:stop-module", value),
  toConsole: (value: ModuleName, callback: Function) => ipcRenderer.on(value, (ev, v: string) => callback(v))
})