import { Source } from "three"

declare global {
    interface Window {
        elevenlabsApi: {
            toClose: (callback: Function) => void
            credentials : ModuleStorage
        }
    }
}

const source = new MediaSource()
const audio = document.querySelector('audio')!
audio.src = window.URL.createObjectURL(source)
const buffer = source.addSourceBuffer('audio/mp3')

const url = 'https://api.elevenlabs.io/v1/text-to-speech/<voice-id>/stream'
const chunkSize = 1024 as const


const headers = {
    "Accept": "audio/mpeg",
    "Content-Type": "application/json",
    "xi-api-key": window.elevenlabsApi.credentials['key'] as string
}

const data = {
    "text": "Born and raised in the charming south, I can add a touch of sweet southern hospitality to your audiobooks and podcasts",
    "model_id": "eleven_monolingual_v1",
}

fetch(url, {
    headers: headers,
    body: JSON.stringify(data)
}).then((res) => {
    const reader = res.body!.getReader()
    function pump(): Promise<any> {
        return reader.read().then(({done, value}) => {
            if (done) {
                return
            }
            buffer.appendBuffer(value)
            return pump()
        })
    }
    return pump()
})


window.elevenlabsApi.toClose(() => window.close())

