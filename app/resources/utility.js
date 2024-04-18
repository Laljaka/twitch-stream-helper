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