type ModuleName = 'twitchpubsub' | 'renderer' | 'http' | 'elevenlabs' 

type Data = {
    'from': ModuleName,
    'to': ModuleName,
    'instruction': Array<any>
}