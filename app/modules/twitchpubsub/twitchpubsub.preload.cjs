const { ipcRenderer, contextBridge } = require('electron/renderer')
const { EventEmitter } = require('node:events')

const _filename = "twitchpubsub"

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

contextBridge.exposeInMainWorld(`${_filename}Api`, {
    credentials: cred,
    stdout: (str) => ipcRenderer.send('stdout', _filename, str),
    onClose: (callback) => { ipcRenderer.on('close', callback) },
    ready: () => ipcRenderer.send('state', _filename, true),
    sender: (msg) => {
        if (isReady) {
            port.postMessage(msg)
        } else {
            portStatus.once('ready', () => {
                port.postMessage(msg)
            })
        }
    }
})

ipcRenderer.send('setUpChannelsReq', _filename)