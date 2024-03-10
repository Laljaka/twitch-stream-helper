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

    async function pump(): Promise<any> {
        let toAdd = arrayBuffer.shift()
        if (!toAdd) {
            const {done, value} = await reader.read()
            if (done) {
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
    audio.addEventListener('ended', () => {
        source.removeSourceBuffer(buffer)
        imgsrc.src = "../../../content/nospeaker.svg"
        callback()
    })
    return await pump()
}

const controls = document.getElementById('controls') as HTMLInputElement

const imgsrc = document.querySelector('img')!

controls.addEventListener('input', () => {
    audio.volume = parseFloat(controls.value) / 100
})

//const url = "https://rr4---sn-gvnuxaxjvh-c35d.googlevideo.com/videoplayback?expire=1709873140&ei=lEPqZZuBKOihsfIP19GbuAk&ip=191.101.61.250&id=o-AElUYZ05d47GNyvbWpOoyg8SqVlSOrGjacc7SRofq9Sr&itag=140&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&spc=UWF9f8hOQAa7XuGxZMfwBZtAIehgvb_D56lurlXaXia3Isg&vprv=1&svpuc=1&mime=audio%2Fmp4&gir=yes&clen=200588287&dur=12394.277&lmt=1708709558249128&keepalive=yes&fexp=24007246&c=ANDROID&txp=4432434&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Cgir%2Cclen%2Cdur%2Clmt&sig=AJfQdSswRgIhAKoJf3Mzq_mHC8utti0P8CrGGDd0hmfNnHwI02q3Ve9tAiEAhzrOSTHqll-jwMAyueZnW2oNsRynhWKMPJHjIte_HB4%3D&redirect_counter=1&rm=sn-n4vlr7l&req_id=354a700a38cea3ee&cms_redirect=yes&ipbypass=yes&mh=7s&mip=90.154.70.195&mm=31&mn=sn-gvnuxaxjvh-c35d&ms=au&mt=1709851272&mv=m&mvi=4&pl=23&lsparams=ipbypass,mh,mip,mm,mn,ms,mv,mvi,pl&lsig=APTiJQcwRQIhAN9hZYH2B47E58qsElQTPEZbj5STgm9BUhzrySsgHtMgAiBbUh-qRq8iMU7Yrkt1AP2PN8RmV9Qryjo1cyFqBdMOMQ%3D%3D"
//const url = 'https://w3.tuberipper.com/download/mp3?_k=4e860bc09a3ee53ec213797d17a84cac'
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

