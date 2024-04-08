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
            loadHTML: (mod: string) => Promise<string>
            //startModule: (v: string) => Promise<void>
            //stopModule: (v: string) => Promise<void>
            toConsole: (callback: Function) => void
            save: (from: string, key: string, value: string|boolean) => void
            stateUpdate: (callback: Function) => void
            startModule: (v: string) => void
            stopModule: (v: string) => void
            openFile: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>
            //openContext: (x: number, y: number, id: string) => Promise<string | null>
          }
    }
}

type Modules = {
    [key: string]: Module
}

type TaskWrapper = {
    (): Promise<void>
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
    }
}

type ElementOptions = {
    id?: string
    name?: string
    type?: string
    className?: string
}