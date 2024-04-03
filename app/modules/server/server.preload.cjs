const { ipcRenderer } = require("electron/renderer")

let cred
for (const arg of process.argv) {
    if (arg.startsWith(':;:')) cred = arg.slice(3)
}

if (!cred) window.close()

window.serverApi = {}
window.serverApi.toClose = function(callback) { ipcRenderer.on('close', callback) }
window.serverApi.credentials = cred
window.serverApi.stdout = function(message) { ipcRenderer.send('stdout', 'server', message) }
window.serverApi.ready = function() { ipcRenderer.send('state', 'server', true) }