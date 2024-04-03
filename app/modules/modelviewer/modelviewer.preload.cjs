const { ipcRenderer, contextBridge } = require('electron/renderer')

let cred
for (const arg of process.argv) {
    if (arg.startsWith(':;:')) cred = arg.slice(3)
}

if (!cred) window.close()

contextBridge.exposeInMainWorld('modelviewerApi', {
    toClose: (callback) => {
        ipcRenderer.once('close', (_e, _v) => callback())
    },
    credentials: cred,
    stdout: (message) => ipcRenderer.send('stdout', 'modelviewer', message),
    onData: (callback) => {
        ipcRenderer.once('instruction', (_e, v) => callback(v))
    },
    ready: () => ipcRenderer.send('state', 'modelviewer', true)
})