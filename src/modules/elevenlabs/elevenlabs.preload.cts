const { ipcRenderer, contextBridge } = require('electron/renderer')

const creds = JSON.parse(process.argv.slice(-1)[0]) as ModuleStorage

contextBridge.exposeInMainWorld('elevenlabsApi', {
    toClose: (callback: Function) => {
        ipcRenderer.once('close', (_e, _v) => callback())
    },
    credentials: creds
})