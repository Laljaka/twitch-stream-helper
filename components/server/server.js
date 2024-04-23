//import http from 'node:http'
const http = require('node:http')
//import fs from 'node:fs/promises'
const fs = require('node:fs/promises')

window.addEventListener('error', (ev) => {
    window.elevenlabsApi.stdout(ev.message)
    window.close()
})

window.serverApi.receiver((m) => {
    window.serverApi.stdout(m)
})

const credentials = JSON.parse(window.serverApi.credentials)
if (!credentials['port']) credentials['port'] = 6969

const __dir = `${process.cwd()}/app/components/server`

const reqMap = {
    '/polls': ["text/html", fs.readFile(`${__dir}/pages/polls.html`)],
    '/polls.cjs': ["text/javascript", fs.readFile(`${__dir}/pages/polls.cjs`)],
    '/polls.css': ["text/css", fs.readFile(`${__dir}/pages/polls.css`)],
    '/predictions': ["text/html", fs.readFile(`${__dir}/pages/predictions.html`)],
    '/predictions.cjs': ["text/javascript", fs.readFile(`${__dir}/pages/predictions.cjs`)],
    '/predictions.css': ["text/css", fs.readFile(`${__dir}/pages/predictions.css`)],
} 

let ctx = 0

const server = http.createServer((req, res) => {
    if (!req.url) {
        res.writeHead(404)
        res.end("Nothing to see here")
    } else if (req.url in reqMap) {
        if (req.method === 'GET') {
            const ref = reqMap[req.url]
            ref[1].then((data) => {
                res.setHeader("Content-type", ref[0])
                res.writeHead(200)
                res.end(data)
            }).catch((err) => {
                res.writeHead(404)
                res.end(err.message)
            })
        } else if (req.method === 'POST') {
            window.serverApi.stdout(`received POST from ${req.url}`)
            res.setHeader("Content-type", 'application/json')
            res.writeHead(200)
            res.end(JSON.stringify({data: ctx}))
            ctx = ctx+1
        }
    } else {
        res.writeHead(404)
        res.end("Nothing to see here")
    }
    /*
    if (req.url === '/polls.js') {}
    if (req.url === '/polls') {
        if (req.method === 'GET') {
            fs.readFile(`${process.cwd()}/dist/components/http/pages/polls.html`)
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
            fs.readFile(`${process.cwd()}/dist/components/http/pages/predictions.html`, (err, data) => {
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
    }*/
})

server.listen(credentials['port'], 'localhost', () => {
    //window.bridge.sendToMain(`Server is running on http://${host}:${port}`)
    window.serverApi.stdout(`running on http://localhost:${credentials['port']}`)
    window.serverApi.ready()
})

window.serverApi.stdout(window.serverApi.credentials)


