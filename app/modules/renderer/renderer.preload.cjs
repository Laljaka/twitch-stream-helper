const { ipcRenderer, contextBridge } = require('electron/renderer')

contextBridge.exposeInMainWorld('rendererApi', {
    toClose: (callback) => {
        ipcRenderer.once('close', (_e, _v) => callback())
    },
    stdout: (message, state) => ipcRenderer.send('stdout', 'renderer', message, state),
    onData: (callback) => {
        ipcRenderer.once('instruction', (_e, v) => callback(v))
    }
})