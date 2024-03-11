const { ipcRenderer, contextBridge } = require('electron/renderer')

contextBridge.exposeInMainWorld('rendererApi', {
    toClose: (callback: Function) => {
        ipcRenderer.once('close', (_e, _v) => callback())
    },
    stdout: (message: string) => ipcRenderer.send('stdout', { from: 'renderer', data: message }),
    onData: (callback: Function) => {
        ipcRenderer.once('instruction', (_e, v) => callback(v))
    }
})