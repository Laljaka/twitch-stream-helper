//import http from 'node:http'
const http = require('node:http')
//import fs from 'node:fs/promises'
const fs = require('node:fs/promises')


const host = "localhost"
const port = 6969

const __dir = `${process.cwd()}/app/modules/server`

const reqMap = {
    '/polls': ["text/html", fs.readFile(`${__dir}/pages/polls.html`)],
    '/polls.cjs': ["text/javascript", fs.readFile(`${__dir}/pages/polls.cjs`)],
    '/polls.css': ["text/css", fs.readFile(`${__dir}/pages/polls.css`)],
    '/predictions': ["text/html", fs.readFile(`${__dir}/pages/predictions.html`)],
    '/predictions.cjs': ["text/javascript", fs.readFile(`${__dir}/pages/predictions.cjs`)],
    '/predictions.css': ["text/css", fs.readFile(`${__dir}/pages/predictions.css`)],
} 

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
        }
    } else {
        res.writeHead(404)
        res.end("Nothing to see here")
        throw new Error('TEST')
    }
    /*
    if (req.url === '/polls.js') {}
    if (req.url === '/polls') {
        if (req.method === 'GET') {
            fs.readFile(`${process.cwd()}/dist/modules/http/pages/polls.html`)
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
            fs.readFile(`${process.cwd()}/dist/modules/http/pages/predictions.html`, (err, data) => {
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

server.listen(port, host, () => {
    //window.bridge.sendToMain(`Server is running on http://${host}:${port}`)
    window.serverApi.stdout(`running on http://${host}:${port}`)
    window.serverApi.ready()
})

window.serverApi.toClose(() => {
    window.close()
})

window.serverApi.stdout(window.serverApi.credentials)


