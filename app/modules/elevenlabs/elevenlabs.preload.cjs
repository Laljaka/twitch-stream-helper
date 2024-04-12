const { ipcRenderer, contextBridge } = require('electron/renderer')

let cred
for (const arg of process.argv) {
    if (arg.startsWith(':;:')) cred = arg.slice(3)
}

if (!cred) window.close()

//** @type {MessagePort | undefined} */
//let port



contextBridge.exposeInMainWorld('elevenlabsApi', {
    onClose: (callback) => { ipcRenderer.once('close', (_e, _v) => callback()) },
    credentials: cred,
    onTask: (callback) => { ipcRenderer.on('task', (_e, args) => callback(args)) },
    stdout: (args) => ipcRenderer.send('stdout', 'elevenlabs', args),
    ready: () => ipcRenderer.send('state', 'elevenlabs', true),
    receiver: function(callback) {
        return new Promise((res, rej) => {
            ipcRenderer.once('setUpChannelsResp', (ev) => {
                const port = ev.ports[0]
                port.addEventListener('message', (m) => {
                    callback(m.data)
                })
                port.start()
                res()
            })
            ipcRenderer.send('setUpChannelsReq', 'elevenlabs')
        })
    }
})