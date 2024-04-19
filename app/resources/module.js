import { BrowserWindow, app } from "electron/main"
import fs from "node:fs/promises"
import path from "node:path"

const __dirname = path.join(app.getAppPath(), '/app');
const __moduledir = path.join(__dirname, '/modules')

const schema = {
    "displayName": "string",
    "type": "string",
    "mode": "string",
    "secure": "boolean",
    "shown": "boolean"
}

export class Module {
    /** @public @readonly */
    name
    /** @type {import("../shared_types.d.ts").ModuleData} @public */
    data
    /** @type {import("../shared_types.d.ts").ModuleStorage} @public */
    storage
    /** @type {BrowserWindow} @protected */
    ref
    /** @type {string} @public */
    html
    /** @type {Electron.Rectangle} */
    bounds
    /** @param {string} name */
    constructor(name) {
        this.name = name
        this.storage = {}
        this.ref = null
        this.bounds = { width: 800, height:600, x: 50, y:50 }
    }

    async initialise() {
        try {
            const prom1 = fs.readFile(path.join(__moduledir, `/${this.name}/${this.name}.desc.json`), {encoding: "utf-8"})
            .then((data) => {
                this.data = JSON.parse(data)
                for (const key in schema) {
                    if (!(key in this.data) || typeof this.data[key] !== schema[key]) {
                        throw 'pew'
                    }
                }
                Object.freeze(this.data)
            })
            
            const prom2 = fs.readFile(path.join(__moduledir, `/${this.name}/${this.name}.desc.html`), {encoding: "utf-8"})
            .then((html) => {
                this.html = html
            })
            
            await Promise.all([prom1, prom2])

            return this.name
        } catch (_) {
            throw this.name
        }
    }

    createWindow() {
        if (this.ref) throw new ReferenceError('Window already exists')
        this.ref = new BrowserWindow({
            title: this.data.displayName,
            width: this.bounds.width, 
            height: this.bounds.height,
            x: this.bounds.x,
            y: this.bounds.y,
            show: false,
            fullscreenable: false,
            autoHideMenuBar: true,
            fullscreen: false,
            maximizable: false,
            webPreferences: {
                nodeIntegration: !this.data.secure,
                contextIsolation: this.data.secure,
                preload: path.join(__dirname, `modules/${this.name}/${this.name}.preload.cjs`),
                additionalArguments: [`:;:${JSON.stringify(this.storage)}`]
            }
        })

        if (this.data.shown) this.ref.once('ready-to-show', () => this.ref.show())

        this.ref.once(('closed'), () => { this.ref = null })

        this.ref.loadFile(path.join(__moduledir, `/${this.name}/${this.name}.html`))
        
        return this.ref
    }

    /** @public */
    closeWindow() {
        if (!this.ref) throw new ReferenceError('Window does not exist')
        this.ref.close()
        //this.ref = null
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
}