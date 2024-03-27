const { ipcRenderer, contextBridge } = require('electron/renderer')

contextBridge.exposeInMainWorld('rendererApi', {
    toClose: (callback) => {
        ipcRenderer.once('close', (_e, _v) => callback())
    },
    stdout: (message) => ipcRenderer.send('stdout', 'modelviewer', message),
    onData: (callback) => {
        ipcRenderer.once('instruction', (_e, v) => callback(v))
    },
    ready: () => ipcRenderer.send('state', 'modelviewer', true)
})