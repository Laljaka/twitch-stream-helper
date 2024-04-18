import { BrowserWindow, safeStorage, app } from "electron/main"
import fs from "node:fs"
import path from "node:path"

const _dir = path.join(process.cwd(), '/app')
const __filepath = path.join(app.getPath('userData'), '/storage.bin')

/**
 * @param {Electron.Rectangle} bounds 
 * @returns {BrowserWindow}
 */
export function createMainWindow(bounds) {
    const win = new BrowserWindow({
        width: bounds.width,
        minWidth: 700,
        height: bounds.height,
        minHeight: 550,
        x: bounds.x,
        y: bounds.y,
        autoHideMenuBar: true,
        fullscreen: false,
        fullscreenable: false,
        maximizable: false,
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
export async function readStorageData(defaults) {
    try {
        const file = await fs.promises.readFile(__filepath)
        const decrypted = safeStorage.decryptString(file)
        const parsed = JSON.parse(decrypted)
        return parsed
    } catch (error) {
        return defaults
    }
}

/**
 * 
 * @param {import('../shared_types.d.ts').MultiModuleStorage} d 
 */
export function writeStorageData(d) {
    fs.writeFileSync(__filepath, safeStorage.encryptString(JSON.stringify(d)))
}