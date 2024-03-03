declare const rendererApi: {
    renderer: Element,
    animate: () => void
    toClose: (callback: Function) => Electron.IpcRenderer
}

document.body.appendChild(rendererApi.renderer)
window.addEventListener('load', () => {
    rendererApi.animate()
})


rendererApi.toClose(() => {
    window.close()
})
