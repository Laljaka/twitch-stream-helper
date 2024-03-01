import { ipcRenderer, contextBridge } from "electron";

contextBridge.exposeInMainWorld('rendererApi', {
    toClose: (callback: Function) => ipcRenderer.once('close', () => callback())
})