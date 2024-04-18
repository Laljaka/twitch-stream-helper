const { ipcRenderer, contextBridge } = require('electron/renderer')
const { EventEmitter } = require('node:events')

const _filename = 'modelviewer'

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
    stdout: (...message) => { 
        ipcRenderer.send('stdout', _filename, message.join(' ')) 
    },
    ready: () => ipcRenderer.send('state', _filename, true),
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

ipcRenderer.send('setUpChannelsReq', _filename)