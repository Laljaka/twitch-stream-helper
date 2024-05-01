const { ipcRenderer, contextBridge } = require('electron/renderer')

const _filename = "twitchpubsub"

const cred = process.argv.find((arg) => arg.startsWith(':;:')).slice(3)

if (!cred) window.close()

const chan = new MessageChannel()

ipcRenderer.postMessage('setUpChannelsReq', _filename, [chan.port2])

contextBridge.exposeInMainWorld(`${_filename}Api`, {
    credentials: cred,
    stdout: (...args) => {
        ipcRenderer.send('stdout', _filename, args.join(' '))
    },
    ready: () => ipcRenderer.send('state', _filename, true),
    sender: (msg) => {
        chan.port1.postMessage(msg)
    }
})