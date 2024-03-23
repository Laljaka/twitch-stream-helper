import { BrowserWindow } from "electron"


type ModuleName = 'twitchpubsub' | 'modelviewer' | 'server' | 'elevenlabs' 

type Data = {
    //'from': ModuleName,
    to: ModuleName,
    instruction: Array<any>
}

type StdOut = {
    from: ModuleName,
    data: string
}

type ModuleStorage = {
    [key: string]: string | boolean
}

type MultiModuleStorage = {
    [key in ModuleName]?: ModuleStorage
}

type ConstantModule = {
    [key in ModuleName]: Function
}

//type ModuleName = keyof MultiModuleStorage

declare global {
    interface Window {
        rendererApi: {
            toClose: (callback: Function) => void
            stdout: (message: string) => void
            onData: (callback: Function) => void
            ready: () => void
        }
        mainApi: {
            storage: MultiModuleStorage
            //startModule: (v: string) => Promise<void>
            //stopModule: (v: string) => Promise<void>
            toConsole: (callback: Function) => void
            save: (from: string, s: MultiModuleStorage) => void
            stateUpdate: (callback: Function) => void
            startModule: (v: string) => void
            stopModule: (v: string) => void
          }
        elevenlabsApi: {
            onClose: (callback: Function) => void
            credentials : ModuleStorage
            onTask: (callback: Function) => void
            stdout: (message: string) => void
            ready: () => void
        }
    }
}


type Modules = {
    [key in ModuleName]?: BrowserWindow
}

type TaskWrapper = {
    (): Promise<void>
}