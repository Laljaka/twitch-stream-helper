import { BrowserWindow } from "electron"
import fs from "node:fs/promises"
import path from "node:path"

const __dir = path.join(process.cwd(), '/app')
const __moduledir = path.join(__dir, '/modules')

export class Module {
    /** @public @readonly */
    name
    /** @type {import("../shared_types.d.ts").ModuleData} @protected */
    data
    /** @type {import("../shared_types.d.ts").ModuleStorage} @protected */
    storage
    /** @type {BrowserWindow} @protected */
    ref
    /** @param {string} name */
    constructor(name) {
        this.name = name
        this.data = null
        this.storage = {}
        this.ref = null
    }

    async initialise() {
        this.data = JSON.parse(await fs.readFile(path.join(__moduledir, `/${this.name}/${this.name}.desc.json`), {encoding: "utf-8"}))
        console.log(`Module ${this.name} initialised`)
    }

    /** @param {Function} [onClose] @public */
    createWindow(onClose) {
        if (this.ref) throw new ReferenceError('Window already exists')
        this.ref = new BrowserWindow({
            width: 800,
            height: 600,
            show: false,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: !this.data.secure,
                contextIsolation: this.data.secure,
                preload: this.data.secure? path.join(__dir, `modules/${this.name}/${this.name}.preload.cjs`) : null,
                //preload: path.join(__dirname, `modules/${moduleName}/${moduleName}.preload.js`),
                additionalArguments: [JSON.stringify(this.storage)]
            }
        })

        this.ref.loadFile(path.join(__moduledir, `/${this.name}/${this.name}.html`))

        if (this.data.shown) this.ref.once('ready-to-show', this.ref.show)

        this.ref.once(('closed'), () => {
            onClose()
            this.ref = null
        })
    }

    /** @public */
    closeWindow() {
        if (!this.ref) throw new ReferenceError('Window does not exist')
        this.ref.webContents.send('close')
    }

    /** @param {import("../shared_types.d.ts").ModuleStorage} storage @public */
    setStorage(storage) {
        this.storage = storage
    }

    /**
     * @param {string} key 
     * @param {string | boolean} value 
     */
    setStorageKey(key, value) {
        this.storage[key] = value
    }

    /**
     * @returns {import("../shared_types.d.ts").ModuleStorage} 
     * @public 
     */
    getStorage() {
        return {...this.storage}
    }
}

/**
 * @param {string} data 
 * @param {string} names 
 * @returns {BrowserWindow}
 */
export function createMainWindow(data, names) {
    const win = new BrowserWindow({
        width: 800,
        minWidth: 700,
        height: 600,
        minHeight: 550,
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            preload: path.join(__dir, 'preload.cjs'),
            additionalArguments: [names, data]
        }
    })

    win.loadFile(path.join(__dir, 'index.html'))

    win.once('ready-to-show', () => win.show())

    return win
}