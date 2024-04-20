import { createPackage } from '@electron/asar';
import { packager, serialHooks } from '@electron/packager';
import { rebuild } from "@electron/rebuild"
import fs from "node:fs"
import { MSICreator } from "electron-wix-msi"
import pkg from "./package.json" with { type: "json" }
import path from "node:path"
import ora from "ora"


let delta = Date.now()
const spin = ora({ spinner: "dots", color: "yellow" }).start("Packaging modules...")

const dirs = fs.readdirSync("./modules", {withFileTypes: true})
    .filter((dir) => dir.isDirectory())
    .map((dir) => dir.name)

fs.mkdirSync(`./modules/modules`)
    
const proms = dirs.reduce((acc, cur) => {
    const src = path.resolve(`./modules/${cur}/`);
    const dest = path.resolve(`./modules/modules/${cur}.asar`);
    acc.push(createPackage(src, dest))
    return acc
}, [])



await Promise.all(proms);


spin.succeed(`Modules packaged in ${delta = Date.now() - delta}ms`)
const spin2 = ora({ spinner: "dots", color: "yellow" }).start("Packaging the app...")
let spinCallback = ora({ spinner: "dots", color: "yellow" })

const bp = await packager({
    dir: path.resolve("./"),
    asar: true,
    ignore: /modules|build\.js/g,
    out: path.resolve('./out'),
    extraResource: path.resolve(`./modules/modules/`),
    overwrite: true,
    beforeCopy: [(b,e,p,a,c) => {
        c()
    }],
    afterCopy: [(b, e, p, a, c) => {
        rebuild({ buildPath: b, electronVersion: e, arch: a })
            .then(() => c())
            .catch((err) => c(err))
    }],
    platform: ["darwin", "win32", "linux"],
    arch: ["x64", "arm64"],
    afterComplete: [(b,e,p,a,c) => {
        c()
    }]
})

spin2.succeed(`App packaged in ${delta = Date.now() - delta}ms`)

await fs.promises.rm(`./modules/modules`, { recursive: true })

const msi = new MSICreator({
    appDirectory: path.resolve(bp.find((str) => str.includes("win32-x64"))),
    outputDirectory: path.resolve("./out/wix-installer"),
    exe: pkg.name,
    description: pkg.description,
    version: pkg.version,
    name: pkg.name,
    arch: "x64",
    manufacturer: pkg.author,
    features: { autoLaunch: false, autoUpdate: false },
    ui: { chooseDirectory: true },
    icon: path.resolve("./content/test.ico")
})

await msi.create()

await msi.compile()
