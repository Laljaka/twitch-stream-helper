//import http from 'node:http'
const http = require('node:http')
//import fs from 'fs'
const fs = require('node:fs')
const path = require("node:path")
const { fileURLToPath } = require('url');
const { EventEmitter } = require("node:events")

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

window.addEventListener('error', (ev) => {
    window.elevenlabsApi.stdout(ev.message)
    window.close()
})
console.log(__dirname)
window.serverApi.receiver((m) => {
    window.serverApi.stdout(m)
})

const credentials = JSON.parse(window.serverApi.credentials)
if (!credentials['port']) credentials['port'] = 6969

const emitter = new EventEmitter()

let i = false
setInterval(() => {
    i ? emitter.emit('polls', 'show') : emitter.emit('polls', 'hide')
    i = !i
}, 5000)


/**
 * 
 * @param {http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }} res 
 */
function sse(res) {
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")
}

const server = http.createServer((req, res) => {
    switch (req.url) {
        case "/polls":
            fs.createReadStream(path.join(__dirname, 'pages', 'polls.html')).pipe(res)
            break
        case "/predictions":
            fs.createReadStream(path.join(__dirname, 'pages', 'predictions.html')).pipe(res)
            break
        case "/polls/stream":
            sse(res)
            emitter.on('polls', (type, arg) => {
                if (type === 'data') {
                    res.write(`data: ${arg}\n`)
                    res.write('\n')
                } else if (type === 'show') {
                    res.write('event: show\n')
                    res.write('data: null\n')
                    res.write('\n')
                } else if (type === 'hide') {
                    res.write('event: hide\n')
                    res.write('data: null\n')
                    res.write('\n')
                }
            })
            res.once('close', () => {
                emitter.removeAllListeners('polls')
            })
            break
        case "/predictions/stream":
            sse(res)
            emitter.on('predictions', (type, arg) => {
                if (type === 'data') {
                    res.write(`data: ${arg}\n`)
                    res.write('\n')
                } else if (type === 'show') {
                    res.write('event: show\n')
                    res.write('data: null\n')
                    res.write('\n')
                } else if (type === 'hide') {
                    res.write('event: hide\n')
                    res.write('data: null\n')
                    res.write('\n')
                }
            })
            res.once('close', () => {
                emitter.removeAllListeners('predictions')
            })
            break
        default:
            res.writeHead(404)
            res.end('nothing to see here')
    }

}).listen(credentials['port'], 'localhost', () => {
    window.serverApi.stdout(`running on http://localhost:${credentials['port']}`)
    window.serverApi.ready()
})

window.serverApi.stdout(window.serverApi.credentials)


