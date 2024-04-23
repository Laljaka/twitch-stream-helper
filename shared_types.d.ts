import { BrowserWindow } from "electron"
import { Component } from "./resources/component.js"

type ComponentStorage = {
    [key: string]: string | boolean
}

type MultiComponentStorage = {
    [key: string]: ComponentStorage
}

declare global {
    interface Window {
        mainApi: {
            loadData: () => Promise<Send>
            toConsole: (calback: (from: string, v: string) => void ) => void
            save: (from: string, key: string, value: string|boolean) => void
            stateUpdate: (callback: (from: string, state: boolean) => void) => void
            controlComponent: (start: boolean, ComponentName: string) => void
            openFile: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>
            openContext: (x: number, y: number, items: Array<string>) => Promise<string | null>
          }
    }
}

type Components = {
    [key: string]: Component
}

type ComponentData = {
    "displayName": string,
    "type": string,
    "mode": string,
    "secure": boolean,
    "shown": boolean
}

type Send = {
    [key: string]: {
        displayName: string
        storage: ComponentStorage
        html: string
    }
}

type ElementOptions = {
    id?: string
    name?: string
    type?: string
    className?: string
}