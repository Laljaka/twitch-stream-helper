import { BrowserWindow } from "electron"

type ModuleName = 'twitchpubsub' | 'renderer' | 'http' | 'elevenlabs' 

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

//type ModuleName = keyof MultiModuleStorage

declare global {
    interface Window {
        rendererApi: {
            toClose: (callback: Function) => void
            stdout: (message: string) => void
            onData: (callback: Function) => void
        }
        mainApi: {
            storage: MultiModuleStorage
            startModule: (v: string) => Promise<void>
            stopModule: (v: string) => Promise<void>
            toConsole: (v: string, callback: Function) => void
            save: (from: string, s: MultiModuleStorage) => void
          }
          elevenlabsApi: {
            onClose: (callback: Function) => void
            credentials : ModuleStorage
            onTask: (callback: Function) => void
            stdout: (args: string) => void
        }
    }
}


type Modules = {
    [key in ModuleName]?: BrowserWindow
}

type TaskWrapper = {
    (): Promise<void>
}