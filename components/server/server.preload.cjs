const { ipcRenderer } = require("electron/renderer")

const _filename = 'server'

let cred
for (const arg of process.argv) {
    if (arg.startsWith(':;:')) cred = arg.slice(3)
}

if (!cred) window.close()

const chan = new MessageChannel()

ipcRenderer.postMessage('setUpChannelsReq', _filename, [chan.port2])

window.serverApi = {
    credentials: cred,
    stdout: (...args) => {
        ipcRenderer.send('stdout', _filename, args.join(' '))
    },
    ready: () => { ipcRenderer.send('state', _filename, true) },
    receiver: (callback) => {
        chan.port1.addEventListener('message', (m) => {
            callback(m.data)
        })
        chan.port1.start()
    }
}