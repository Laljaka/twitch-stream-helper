const { ipcRenderer, contextBridge } = require('electron/renderer')

let cred
for (const arg of process.argv) {
    if (arg.startsWith(':;:')) cred = arg.slice(3)
}

if (!cred) window.close()

contextBridge.exposeInMainWorld('twitchpubsubApi', {
    credentials: cred,
    stdout: (str) => ipcRenderer.send('stdout', "twitchpubsub", str),
    onClose: (callback) => { ipcRenderer.on('close', callback) },
    ready: () => ipcRenderer.send('state', 'twitchpubsub', true)
})

