const { ipcRenderer } = require('electron/renderer')
import Http from 'node:http'
const http: typeof Http = require('node:http')
import Fs from 'node:fs'
const fs: typeof Fs = require('node:fs')

const host = "localhost"
const port = 6969

const server = http.createServer((req, res) => {
    if (req.url === '/polls') {
        if (req.method === 'GET') {
            fs.readFile(`${process.cwd()}/dist/modules/http/polls.html`, (err, data) => {
                if (err) {
                    res.writeHead(404)
                    res.end(err.message)
                } else {
                    res.setHeader("Content-type", "text/html")
                    res.writeHead(200)
                    res.end(data)
                }
            })
        } else if (req.method === 'POST') {
            res.writeHead(200)
            res.end('emulating data')
        }
    } else if (req.url === '/predictions') {
        if (req.method === "GET") {
            fs.readFile(`${process.cwd()}/dist/modules/http/predictions.html`, (err, data) => {
                if (err) {
                    res.writeHead(404)
                    res.end(err.message)
                } else {
                    res.setHeader("Content-type", "text/html")
                    res.writeHead(200)
                    res.end(data)
                }
            })            
        }
    } else {
        res.writeHead(404)
        res.end("Nothing to see here")
    }
})

server.listen(port, host, () => {
    //window.bridge.sendToMain(`Server is running on http://${host}:${port}`)
    ipcRenderer.send('stdout', {from: "http", data: `Server is running on http://${host}:${port}`})
})


ipcRenderer.once('close', () => {
    window.close()
})

