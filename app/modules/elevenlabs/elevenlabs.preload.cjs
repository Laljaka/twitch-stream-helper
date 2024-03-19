const { ipcRenderer, contextBridge } = require('electron/renderer')

console.log(process.argv)
const creds = JSON.parse(process.argv.slice(-1)[0])

contextBridge.exposeInMainWorld('elevenlabsApi', {
    onClose: (callback) => {
        ipcRenderer.once('close', (_e, _v) => callback())
    },
    credentials: creds,
    onTask: (callback) => {
        ipcRenderer.on('task', (_e, args) => callback(args))
    },
    stdout: (args, state) => ipcRenderer.send('stdout', 'elevenlabs', args, state)
})