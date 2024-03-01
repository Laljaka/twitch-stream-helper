

declare const rendererApi: {
    toClose: (callback: Function) => Electron.IpcRenderer
}

rendererApi.toClose(() => {
    window.close()
})
