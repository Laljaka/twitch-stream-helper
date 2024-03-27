import { BrowserWindow } from "electron"
import fs from "node:fs"
import path from "node:path"

const __dir = path.join(process.cwd(), '/app')
const __moduledir = path.join(__dir, '/modules')

export class Module {
    /** @public */
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
        this.data = JSON.parse(fs.readFileSync(path.join(__moduledir, `/${name}/${name}.desc.json`), {encoding: "utf-8"}))
        this.storage = {}
        this.ref = null
    }

    /** @param {Function} onClose  */
    createWindow(onClose) {
        const win = new BrowserWindow({
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

        win.loadFile(path.join(__moduledir, `/${this.name}/${this.name}.html`))

        if (this.data.shown) win.once('ready-to-show', () => win.show())

        win.once(('closed'), onClose)
        
        this.ref = win
    }    
}