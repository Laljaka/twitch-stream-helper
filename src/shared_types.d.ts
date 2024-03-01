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

//type ModuleVal = 'clientId' | 'access' | 'subscriptions' | 'xrot' | 'yrot' | 'mul' | 'host' | 'port' | 'key' 

type MultiModuleStorage = {
    twitchpubsub: {
        clientId: string
        access: string
        subscribtions: {
            [key: string]: boolean
        }
    }
    renderer: {
        xrot: `${number}` | ''
        yrot: `${number}` | ''
        mul: `${number}` | ''
    }
    http: {
        host: string
        port: `${number}` | ''
    }
    elevenlabs: {
        key: string
    }
}

//type ModuleName = keyof MultiModuleStorage