const { ipcRenderer, contextBridge } = require('electron/renderer')

contextBridge.exposeInMainWorld('rendererApi', {
    toClose: (callback: Function) => {
        ipcRenderer.once('close', (_e, _v) => callback())
    }
})