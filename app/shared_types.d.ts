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
            stdout: (message: string, state: boolean|null) => void
            onData: (callback: Function) => void
        }
        mainApi: {
            storage: MultiModuleStorage
            startModule: (v: string) => Promise<void>
            stopModule: (v: string) => Promise<void>
            toConsole: (callback: Function) => void
            save: (from: string, s: MultiModuleStorage) => void
            stateUpdate: (callback: Function) => void
            startModuleNew: (v: string) => void
            stopModuleNew: (v: string) => void
          }
        elevenlabsApi: {
            onClose: (callback: Function) => void
            credentials : ModuleStorage
            onTask: (callback: Function) => void
            stdout: (args: string, state: boolean|null) => void
        }
    }
}


type Modules = {
    [key in ModuleName]?: BrowserWindow
}

type TaskWrapper = {
    (): Promise<void>
}