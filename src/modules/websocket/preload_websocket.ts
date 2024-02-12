import { contextBridge, ipcRenderer } from 'electron/renderer'

contextBridge.exposeInMainWorld('bridge', {
    sendToMain: (value: any) => ipcRenderer.send('websocket-data', value),
    receiveFromMain: (callback: any) => ipcRenderer.on('websocket-command', (_event, value) => callback(value))
})