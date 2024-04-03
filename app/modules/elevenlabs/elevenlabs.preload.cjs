const { ipcRenderer, contextBridge } = require('electron/renderer')

let cred
for (const arg of process.argv) {
    if (arg.startsWith(':;:')) cred = arg.slice(3)
}

if (!cred) window.close()

contextBridge.exposeInMainWorld('elevenlabsApi', {
    onClose: (callback) => {
        ipcRenderer.once('close', (_e, _v) => callback())
    },
    credentials: cred,
    onTask: (callback) => {
        ipcRenderer.on('task', (_e, args) => callback(args))
    },
    stdout: (args) => ipcRenderer.send('stdout', 'elevenlabs', args),
    ready: () => ipcRenderer.send('state', 'elevenlabs', true)
})