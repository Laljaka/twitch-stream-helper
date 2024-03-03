import { ipcRenderer } from 'electron'

ipcRenderer.once('close', () => {
    window.close()
})
