const { ipcRenderer, contextBridge } = require('electron/renderer')

const creds = JSON.parse(process.argv.slice(-1)[0]) as ModuleStorage

contextBridge.exposeInMainWorld('elevenlabsApi', {
    onClose: (callback: Function) => {
        ipcRenderer.once('close', (_e, _v) => callback())
    },
    credentials: creds,
    onTask: (callback: Function) => {
        ipcRenderer.on('task', (_e, args) => callback(args))
    },
    stdout: (args: string) => ipcRenderer.send('stdout', args)
})