/** @type {Map<string, Electron.MessagePortMain>} */
const commPorts = new Map()

process.parentPort.on('message', (a) => {
    const port = a.ports[0]
    const from = a.data
    commPorts.set(from, port)
    port.on('message', (m) => {
        commPorts.forEach((v, k) => {
            if (k === from) return 
            console.log('sending to', k)
            v.postMessage(m.data)
        })
    })
    port.once('close', () => {
        port.removeAllListeners('message')
        commPorts.delete(from)
        console.log('no more', from)
    })
    port.start()
    console.log(from, 'set up')
})