import { BrowserWindow } from "electron"
import { Module } from "./resources/module.js"

type ModuleStorage = {
    [key: string]: string | boolean
}

type MultiModuleStorage = {
    [key: string]: ModuleStorage
}

declare global {
    interface Window {
        mainApi: {
            loadData: () => Promise<Send>
            //startModule: (v: string) => Promise<void>
            //stopModule: (v: string) => Promise<void>
            toConsole: (calback: (from: string, v: string) => void ) => void
            save: (from: string, key: string, value: string|boolean) => void
            stateUpdate: (callback: (from: string, state: boolean) => void) => void
            startModule: (v: string) => void
            stopModule: (v: string) => void
            openFile: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>
            openContext: (x: number, y: number, items: Array<string>) => Promise<string | null>
          }
    }
}

type Modules = {
    [key: string]: Module
}

type ModuleData = {
    "displayName": string,
    "type": string,
    "mode": string,
    "secure": boolean,
    "shown": boolean
}

type Send = {
    [key: string]: {
        displayName: string
        storage: ModuleStorage
        html: string
    }
}

type ElementOptions = {
    id?: string
    name?: string
    type?: string
    className?: string
}