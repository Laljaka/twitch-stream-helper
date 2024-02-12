import { contextBridge, ipcRenderer } from 'electron/renderer'

contextBridge.exposeInMainWorld('api', {
  startModule: (value: any) => ipcRenderer.send('main:start-module', value),
  stopModule: (value: any) => ipcRenderer.send("main:stop-module", value)
})