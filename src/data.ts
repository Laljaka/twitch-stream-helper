import crypto from "crypto"
import fs from "fs"
import path from "node:path"

const defaults: MultiModuleStorage = {}

const algo = 'aes-256-cbc'
let password = process.argv[2]
password = password.padEnd(32, password)
const filepath = path.join(process.cwd(), 'content/storage.bin')

process.exitCode = 2

//TODO God damn first start handling with no storage.bin existing
if (process.argv[3] === 'read') {
    fs.readFile(filepath, (err, data) => {
        if (err) {
            //process.exit(1)
            fs.open(filepath, 'w', (err, fd) => {
                if (err) process.exit(1)
                else {
                    fs.writeSync(fd, encrypt(JSON.stringify(defaults)))
                    fs.closeSync(fd)
                    process.parentPort.postMessage(JSON.stringify(defaults))
                    process.exit(0)
                }
            })
        } else {
            process.parentPort.postMessage(decrypt(data))
            process.exit(0)
        }
    })
} else if (process.argv[3] === 'write') {
    fs.writeFile(filepath, encrypt(process.argv[4]), (err) => {
        if (err) process.exit(1)
        else process.exit(0)
    })
} else process.exit(2)

function encrypt(d: string) {
    //const buff = crypto.scryptSync(password, login, 32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(algo, password, iv)
    let encrypted = cipher.update(d, 'utf-8')
    const nnn = cipher.final()
    return Buffer.concat([iv, encrypted, nnn])
}

function decrypt(e: Buffer) {
    const iv = e.subarray(0, 16)
    const enc = e.subarray(16, e.length)
    //const buff2 = crypto.scryptSync(password, login, 32)
    const decipher = crypto.createDecipheriv(algo, password, iv)
    let decrypted = decipher.update(enc, undefined, 'utf-8')
    decrypted += decipher.final('utf-8')
    return decrypted
}

//TODO make sure that if the file is not present it is created
