const { ipcRenderer } = require('electron/renderer')
const http = require('http')

const host = "localhost"
const port = 6969

const requestListener = function (req, res) {
    res.writeHead(200);
    res.end("My first server!");
};


/*
server.listen(port, host, () => {
    window.bridge.sendToMain(`Server is running on http://${host}:${port}`)
    //ipcRenderer.send('http-data', `Server is running on http://${host}:${port}`)
});



 */

ipcRenderer.once('close', () => {
    window.close()
})

process.parentPort.on('message', (e) => {
    const processPort = e.ports[0]
    processPort.postMessage('aaaaaaaaaaaaaaaaaaaa')
})
