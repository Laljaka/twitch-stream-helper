class TaskQueue {
    /** @type {Array<import("../../shared_types.d.ts").TaskWrapper>} @protected */
    list
    /** @protected */
    onTask

    constructor() {
        this.list = []
        this.onTask = false
    }

    /** @protected */
    async execute() {
        const todo = this.list.shift()
        if (todo) {
            await todo().catch((err) => window.elevenlabsApi.stdout(`An error has occured: ${err}`))
            this.execute()
        } else this.onTask = false
    }
    
    /**
     * @param {import("../../shared_types.d.ts").TaskWrapper} callback 
     * @public
     */
    addTask(callback) {
        this.list.push(callback)
        if (this.onTask) return
        this.onTask = true
        this.execute()
    }
}


const audio = document.querySelector('audio')


// TODO add timed rejection and error handling
/**
 * 
 * @param {string} args 
 * @returns {Promise<void>}
 */
async function task(args) {
    const source = new MediaSource()
    audio.src = window.URL.createObjectURL(source)

    const prom1 = fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({text: args, model_id: "eleven_multilingual_v2"})
    })

    /** @type {Promise<void>} */
    const prom2 = new Promise((res, rej) => {
        if (source.readyState === 'open') res()
        else source.onsourceopen = () => {
            source.onsourceopen = null
            res()
        }
    })

    const response = await Promise.all([prom1, prom2])
    
    const reader = response[0].body.getReader()

    const arrayBuffer = []
    let toSkip = false
    skip.disabled = false

    const buffer = source.addSourceBuffer('audio/mpeg')
    //buffer.addEventListener('update', (ev) => {
        //if (ev.type === 'update')

    //})

    imgsrc.src = "../../../content/speaker.svg"

    /**
     * 
     * @returns {Promise<void>}
     */
    async function pump() {
        if (toSkip) return source.endOfStream()
             
        let toAdd = arrayBuffer.shift()
        if (!toAdd) {
            const {done, value} = await reader.read()
            if (done) return source.endOfStream()
            toAdd = value
        }
        try {
            buffer.appendBuffer(toAdd)                
        } catch (err) {
            arrayBuffer.push(toAdd)
                
            return new Promise((res, rej) => setTimeout(() => res(pump()), 10000))
        }
        /** @type {Promise<void>} */
        await new Promise((res, rej) => {
            if (buffer.updating) buffer.onupdate = () => res()
            else res()
        })

        return pump()         
    }

    pump()
    audio.play()

    return new Promise((res, rej) => {
        audio.onended = () => {
            skip.disabled = true
            skip.onclick = null
            audio.onended = null
            //source.removeSourceBuffer(buffer)
            window.URL.revokeObjectURL(audio.src)
            imgsrc.src = "../../../content/nospeaker.svg"
            res()
        }
        skip.onclick = () => {
            skip.disabled = true
            audio.onended = null
            skip.onclick = null
            toSkip = true
            //source.removeSourceBuffer(buffer)
            window.URL.revokeObjectURL(audio.src)
            imgsrc.src = "../../../content/nospeaker.svg"
            res()
        }
    })
}

const controls = document.getElementById('controls')

const imgsrc = document.querySelector('img')

const skip = document.querySelector('button')

controls.addEventListener('input', () => {
    //@ts-ignore
    audio.volume = parseFloat(controls.value) / 100
})


const url = 'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/stream'
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





window.elevenlabsApi.onTask((args) => {
    queue.addTask(() => task(args))
})


window.elevenlabsApi.onClose(() => {
    window.close()
})

window.addEventListener('beforeunload', (ev) => {
    console.log('HERE BE VOLUME SAVING')
})

queue.addTask(() => task('Testing 1 a very long text Testing 1 a very long textTesting 1 a very long text'))
queue.addTask(() => task('Testing 2 electric boogaloo'))

window.elevenlabsApi.stdout('finished loading module')
window.elevenlabsApi.ready()

window.addEventListener('error', (ev) => {
    window.elevenlabsApi.stdout(ev.message)
    window.close()
})

window.elevenlabsApi.stdout(window.elevenlabsApi.credentials)
