const { ipcRenderer, contextBridge } = require('electron/renderer')

contextBridge.exposeInMainWorld('elevenlabsApi', {
    toClose: (callback: Function) => {
        ipcRenderer.once('close', (_e, _v) => callback())
    }
})