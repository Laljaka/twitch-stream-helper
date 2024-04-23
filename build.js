import { createPackage } from '@electron/asar';
import { packager, serialHooks } from '@electron/packager';
import { rebuild } from "@electron/rebuild"
import fs from "node:fs"
import { MSICreator } from "electron-wix-msi"
import pkg from "./package.json" with { type: "json" }
import path from "node:path"
import { DefaultRenderer, Listr, delay } from "listr2"
import EventEmitter from 'node:events';

const platforms = ["darwin", "win32", "linux"]
const archs = ["x64", "arm64"]

let bp

const listr = new Listr([
    {
        title: "Handling components...",
        task: (_, task) => {
            return task.newListr([
                {
                    title: "Reading components directory... ",
                    task: async (ctx, task) => {
                        const promdirs = await fs.promises.readdir("./components", {withFileTypes: true})
                        promdirs.filter((dir) => dir.isDirectory()).map((dir) => dir.name).forEach((val) => ctx.push(val))
                    },
                    exitOnError: false,
                },
                {
                    title: "Creating temporary components directory...",
                    skip: (ctx) => ctx.length === 0 ? "No components were found" : false,
                    task: async (ctx, task) => {
                        if (fs.existsSync(`./components/components`)) await fs.promises.rm(`./components/components`, { recursive: true })
                        await fs.promises.mkdir(`./components/components`)
                    } 
                },
                {
                    title: "Packaging components...",
                    skip: (ctx) => ctx.length === 0? "No components were found" : false,
                    task: (ctx, task) => {
                        const map = ctx.map((val) => {
                            return {
                                title: `Packaging ${val}`,
                                task: async () => {
                                    const src = path.resolve(`./components/${val}/`);
                                    const dest = path.resolve(`./components/components/${val}.asar`);
                                    await createPackage(src, dest)
                                },
                            }
                        })
                        return task.newListr(map, { concurrent: true, exitOnError: false, rendererOptions: { collapseSubtasks: true, suffixSkips: true} })
                    }
                }
            ], {concurrent: false, exitOnError: true, ctx: [], rendererOptions: { collapseSubtasks: false, suffixSkips: true}})
        }
    },
    {
        title: "Packaging the app...",
        task: async (ctx, task) => {
            const emitter = new EventEmitter()
            const testlistr = new Listr([], {concurrent: true, exitOnError: false, rendererOptions: { suffixSkips: true}})
            for (const platform of platforms) {
                for (const arch of archs) {
                    testlistr.add({
                        title: `Packaging for ${platform}-${arch}`,
                        task: (ctx, task) => {
                            return new Promise((res, rej) => {
                                emitter.once(`${platform}-${arch} done`, res)
                                emitter.once('finished', () => {
                                    emitter.removeAllListeners(`${platform}-${arch} done`)
                                    emitter.removeAllListeners('error')
                                    if (platform === 'darwin') rej(new Error(`Building for ${platform}-${arch} requires admin privilages`))
                                    else rej(new Error("Could not build for " + platform + " " + arch))
                                })
                                emitter.once('error', (err) => {
                                    emitter.removeAllListeners(`${platform}-${arch} done`)
                                    emitter.removeAllListeners(`finished`)
                                    rej(err)
                                })
                            })
                        }
                    })
                }
            }
            packager({
                dir: path.resolve("./"),
                asar: true,
                ignore: /components|build\.js/g,
                out: path.resolve('./out'),
                extraResource: fs.existsSync(`./components/components/`) ? path.resolve(`./components/components/`) : null,
                overwrite: true,
                afterCopy: [(b, e, p, a, c) => {
                    rebuild({ buildPath: b, electronVersion: e, arch: a })
                        .then(() => c())
                        .catch((err) => c(err))
                }],
                platform: platforms,
                arch: archs,
                afterComplete: [(b,e,p,a,c) => {
                    emitter.emit(`${p}-${a} done`)
                    c()
                }],
                quiet: true
            }).then((b) => {
                bp = b
                emitter.emit('finished')
            }).catch((err) => emitter.emit('error', err))
            return testlistr
        }
    },
    {
        title: "Cleaning the mess...",
        task: async(ctx, task) => {
            if (fs.existsSync(`./components/components`)) await fs.promises.rm(`./components/components`, { recursive: true })
            else task.skip("No mess was created!")
        }
    },
    {
        title: "Creating installers...",
        task: (ctx, task) => task.newListr([
            {
                title: "Windows msi",
                task: async (ctx, task) => {
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
                }
            }
        ]) 
    }

], { concurrent: false, rendererOptions: { collapseSubtasks: false, suffixSkips: true }})



listr.rendererClass = DefaultRenderer
const smt = await listr.run()


/*


await fs.promises.rm(`./components/components`, { recursive: true })
/*

*/