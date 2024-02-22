import { CallbackResponse } from 'electron'
import { contextBridge, ipcRenderer } from 'electron/renderer'

contextBridge.exposeInMainWorld('api', {
  startModule: (value: ModuleName) => ipcRenderer.invoke('main:start-module', value),
  stopModule: (value: ModuleName) => ipcRenderer.invoke("main:stop-module", value),
  receive: (value: ModuleName, callback: any) => ipcRenderer.on(value, callback)
})