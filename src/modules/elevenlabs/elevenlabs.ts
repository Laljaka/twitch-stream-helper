const { ipcRenderer } = require('electron')

ipcRenderer.once('close', () => {
    window.close()
})
