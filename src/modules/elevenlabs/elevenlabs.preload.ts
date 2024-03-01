import { ipcRenderer, contextBridge } from "electron";

contextBridge.exposeInMainWorld('elevenlabsApi', {
    toClose: (callback: Function) => ipcRenderer.once('close', () => callback())
})