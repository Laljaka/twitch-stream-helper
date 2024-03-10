declare global {
    interface Window {
        elevenlabsApi: {
            onClose: (callback: Function) => void
            credentials : ModuleStorage
            onTask: (callback: Function) => void
        }
    }
}

class TaskQueue {
    protected list: Array<Function>
    protected onTask: boolean

    constructor() {
        this.list = []
        this.onTask = false
    }

    protected execute() {
        const todo = this.list.shift()
        if (todo) todo(this.execute)
        else this.onTask = false
    }
    
    public addTask(callback: Function) {
        this.list.push(callback)
        if (this.onTask) return
        this.onTask = true
        this.execute()
    }
}

const source = new MediaSource()
const audio = document.querySelector('audio')!
audio.src = window.URL.createObjectURL(source)

async function task(callback: Function, args: any) {
    const arrayBuffer: Array<Uint8Array> = []
    const response = await fetch(url, {
        method: 'GET',
        //headers: headers,
        //body: JSON.stringify(data)
    })
    const reader = response.body!.getReader()
    const buffer = source.addSourceBuffer('audio/mp4;codecs="mp4a.40.2"')
    audio.play()
    imgsrc.src = "../../../content/speaker.svg"

    let toSkip = false

    async function pump(): Promise<any> {
        let toAdd = arrayBuffer.shift()
        if (!toAdd) {
            const {done, value} = await reader.read()
            if (done || toSkip) {
                source.endOfStream()
                return 
            }
            toAdd = value
        }
        try {
            buffer.appendBuffer(toAdd)                
        } catch (err) {
            arrayBuffer.push(toAdd)
            setTimeout(pump, 10000)
            return
        }
        await new Promise<void>((res, rej) => {
            buffer.onupdate = () => res()
        })
        return await pump()         
        }
    audio.onended = () => {
        source.removeSourceBuffer(buffer)
        imgsrc.src = "../../../content/nospeaker.svg"
        callback()
    }
    skip.onclick = () => {
        toSkip = true
        audio.onended = null
        source.removeSourceBuffer(buffer)
        imgsrc.src = "../../../content/nospeaker.svg"
        callback()
    }
    return await pump()
}

const controls = document.getElementById('controls') as HTMLInputElement

const imgsrc = document.querySelector('img')!

const skip = document.querySelector('button')!

controls.addEventListener('input', () => {
    audio.volume = parseFloat(controls.value) / 100
})


const url = 'http://localhost:8000/videoplayback.mp4'
const headers = {
    "Accept": "audio/mpeg",
    "Content-Type": "application/json",
    "xi-api-key": "5ccfceb65a209171f914fd62ad505720"//window.elevenlabsApi.credentials['key'] as string
}

const data = {
    "text": "Born and raised in the charming south Born and raised in the charming south Born and raised in the charming south",
    "model_id": "eleven_multilingual_v2",
}



const queue = new TaskQueue()




source.addEventListener('sourceopen', async () => {
    window.elevenlabsApi.onTask((args:any) => {
        queue.addTask((callback: Function) => task(callback, args))
    })
})

window.elevenlabsApi.onClose(() => window.close())

window.addEventListener('beforeunload', (ev) => {
    console.log('HERE BE VOLUME SAVING')
})

