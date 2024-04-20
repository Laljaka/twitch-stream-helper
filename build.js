import { createPackage } from '@electron/asar';
import { packager, serialHooks } from '@electron/packager';
import { rebuild } from "@electron/rebuild"
import fs from "node:fs"
import { MSICreator } from "electron-wix-msi"
import pkg from "./package.json" with { type: "json" }


const dirs = fs.readdirSync("./modules", {withFileTypes: true})
    .filter((dir) => dir.isDirectory())
    .map((dir) => dir.name)

fs.mkdirSync(`./modules/modules`)
    
const proms = dirs.reduce((acc, cur) => {
    const src = `./modules/${cur}/`;
    const dest = `./modules/modules/${cur}.asar`;
    acc.push(createPackage(src, dest))
    return acc
}, [])



await Promise.all(proms);


console.log('generated asar for modules');

let ar

const bp = await packager({
    dir: "./",
    asar: true,
    ignore: /modules|build\.js/g,
    out: './out',
    afterCopyExtraResources: [(b, e, p, a, c) => {
        fs.rm(`./modules/modules`, { recursive: true }, (err) => {
            if (err) c(err)
            else c()
        })
    }],
    extraResource: `./modules/modules/`,
    overwrite: true,
    afterCopy: [(b, e, p, a, c) => {
        rebuild({ buildPath: b, electronVersion: e, arch: a })
            .then(() => c())
            .catch((err) => c(err))
    }],
    afterComplete: [(b, ev, p, a, c) => {
        ar = a
        c()
    }]
})

const msi = new MSICreator({
    appDirectory: bp[0],
    outputDirectory: "./out",
    exe: pkg.name,
    description: pkg.description,
    version: pkg.version,
    name: pkg.name,
    // @ts-ignore
    arch: ar,
    manufacturer: pkg.author,
    features: { autoLaunch: false, autoUpdate: false },
    ui: { chooseDirectory: true },
    icon: "./content/test.ico"
})

await msi.create()

await msi.compile()