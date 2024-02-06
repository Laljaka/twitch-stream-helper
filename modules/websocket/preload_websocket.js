const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('bridge', {
    sendToMain: (value) => ipcRenderer.send('websocket-data', value),
    receiveFromMain: (callback) => ipcRenderer.on('websocket-command', (_event, value) => callback(value))
})