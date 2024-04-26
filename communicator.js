/** @type {Map<string, Electron.MessagePortMain>} */
const senders = new Map()
/** @type {Map<string, Electron.MessagePortMain>} */
const receivers = new Map()

process.parentPort.on('message', (a) => {
    const port = a.ports[0]
    const from = a.data[0]
    const type = a.data[1]
    if (type === 'sender') {
        senders.set(from, port)
        port.on('message', (m) => {
            receivers.forEach((v, k) => {
                console.log('sending to', k)
                v.postMessage(m.data)
            })
        })
        port.once('close', () => {
            port.removeAllListeners('message')
            senders.delete(from)
            
            console.log('no more', from)
        })
    } else {
        receivers.set(from, port)
        port.once('close', () => {
            receivers.delete(from)
            
            console.log('no more', from)
        })
    }
    port.start()
    console.log(from, type, 'set up')
})