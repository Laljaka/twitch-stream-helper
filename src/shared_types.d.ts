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

