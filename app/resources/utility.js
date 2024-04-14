import { BrowserWindow, safeStorage, app } from "electron/main"
import fs from "node:fs"
import path from "node:path"

const _dir = path.join(process.cwd(), '/app')
const __filepath = path.join(app.getPath('userData'), '/storage.bin')

/**
 * @returns {BrowserWindow}
 */
export function createMainWindow() {
    const win = new BrowserWindow({
        width: 800,
        minWidth: 700,
        height: 600,
        minHeight: 550,
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            preload: path.join(_dir, 'preload.cjs')
        }
    })

    win.loadFile(path.join(_dir, 'index.html'))

    win.once('ready-to-show', () => win.show())

    return win
}

/**
 * @param {import('../shared_types.d.ts').MultiModuleStorage} defaults 
 * @returns {Promise<import('../shared_types.d.ts').MultiModuleStorage>}
 */
export function readStorageData(defaults) {
    return new Promise((res, rej) => {
        fs.readFile(__filepath, (err1, data) => {
            if (err1) {
                fs.open(__filepath, 'w', (err2, fd) => {
                    if (err2) rej(`Could not open the old file nor create a new one -- ${err1} + ${err2}`)
                    else {
                        fs.writeSync(fd, safeStorage.encryptString(JSON.stringify(defaults)))
                        fs.closeSync(fd)
                        res(defaults)
                    }
                })
            } else {
                try {
                    const decrypted = safeStorage.decryptString(data)
                    res(JSON.parse(decrypted))
                } catch (err) {
                    console.log(err)
                    fs.writeFileSync(__filepath, safeStorage.encryptString(JSON.stringify(defaults)))
                    res(defaults)
                }
                
            }
            console.log('read the file')
        })
    })
}

/**
 * 
 * @param {import('../shared_types.d.ts').MultiModuleStorage} d 
 * @returns {Promise<void>}
 */
export function writeStorageData(d) {
    return new Promise((res, rej) => {
        fs.writeFile(__filepath, safeStorage.encryptString(JSON.stringify(d)), (err) => {
            if (err) rej('How?')
            else res()
        })
    })
}