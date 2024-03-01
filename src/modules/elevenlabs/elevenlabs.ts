declare const elevenlabsApi: {
    toClose: (callback: Function) => Electron.IpcRenderer
}

elevenlabsApi.toClose(() => {
    window.close()
})
