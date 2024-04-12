const { ipcRenderer, contextBridge } = require('electron/renderer')
const { EventEmitter } = require('node:events')

let cred
for (const arg of process.argv) {
    if (arg.startsWith(':;:')) cred = arg.slice(3)
}

if (!cred) window.close()

let isReady = false

/** @type {MessagePort | undefined} */
let port

const portStatus = new EventEmitter()

ipcRenderer.once('setUpChannelsResp', (ev) => {
    port = ev.ports[0]
    isReady = true
    portStatus.emit('ready')
})
ipcRenderer.send('setUpChannelsReq', 'elevenlabs')


contextBridge.exposeInMainWorld('elevenlabsApi', {
    onClose: (callback) => { ipcRenderer.once('close', (_e, _v) => callback()) },
    credentials: cred,
    onTask: (callback) => { ipcRenderer.on('task', (_e, args) => callback(args)) },
    stdout: (args) => ipcRenderer.send('stdout', 'elevenlabs', args),
    ready: () => ipcRenderer.send('state', 'elevenlabs', true),
    receiver: (callback) => {
        if (!isReady) {
            portStatus.once('ready', () => {
                port.addEventListener('message', (m) => {
                    callback(m.data)
                })
                port.start()
            })
        } else {
            port.addEventListener('message', (m) => {
                callback(m.data)
            })
            port.start()
        }
    }
})