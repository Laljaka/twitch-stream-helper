

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



//const url = "https://rr4---sn-gvnuxaxjvh-c35d.googlevideo.com/videoplayback?expire=1709873140&ei=lEPqZZuBKOihsfIP19GbuAk&ip=191.101.61.250&id=o-AElUYZ05d47GNyvbWpOoyg8SqVlSOrGjacc7SRofq9Sr&itag=140&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&spc=UWF9f8hOQAa7XuGxZMfwBZtAIehgvb_D56lurlXaXia3Isg&vprv=1&svpuc=1&mime=audio%2Fmp4&gir=yes&clen=200588287&dur=12394.277&lmt=1708709558249128&keepalive=yes&fexp=24007246&c=ANDROID&txp=4432434&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Cgir%2Cclen%2Cdur%2Clmt&sig=AJfQdSswRgIhAKoJf3Mzq_mHC8utti0P8CrGGDd0hmfNnHwI02q3Ve9tAiEAhzrOSTHqll-jwMAyueZnW2oNsRynhWKMPJHjIte_HB4%3D&redirect_counter=1&rm=sn-n4vlr7l&req_id=354a700a38cea3ee&cms_redirect=yes&ipbypass=yes&mh=7s&mip=90.154.70.195&mm=31&mn=sn-gvnuxaxjvh-c35d&ms=au&mt=1709851272&mv=m&mvi=4&pl=23&lsparams=ipbypass,mh,mip,mm,mn,ms,mv,mvi,pl&lsig=APTiJQcwRQIhAN9hZYH2B47E58qsElQTPEZbj5STgm9BUhzrySsgHtMgAiBbUh-qRq8iMU7Yrkt1AP2PN8RmV9Qryjo1cyFqBdMOMQ%3D%3D"
const url = 'https://w3.tuberipper.com/download/mp3?_k=4e860bc09a3ee53ec213797d17a84cac'
const headers = {
    "Accept": "audio/mpeg",
    "Content-Type": "application/json",
    "xi-api-key": "5ccfceb65a209171f914fd62ad505720"//window.elevenlabsApi.credentials['key'] as string
}

const data = {
    "text": "Born and raised in the charming south Born and raised in the charming south Born and raised in the charming south",
    "model_id": "eleven_multilingual_v2",
}

const arrayBuffer: Array<Uint8Array> = []

source.addEventListener('sourceopen', () => {
    console.log('source ready')
    console.log('fetching')
    fetch(url, {
        method: 'GET',
        //headers: headers,
        //body: JSON.stringify(data)
    }).then(async (res) => {
        //res.json().then((res) => console.log(res))
        //console.log(await res.text())
        console.log('getting body')
        const reader = res.body!.getReader()
        console.log('running pump')
        const buffer = source.addSourceBuffer('audio/mpeg')//;codecs="mp4a.40.2"')
        audio.play()
        let cold = true
        let interval
        //buffer.onupdate = (ev) => {
        //    console.log(ev.type)
        //}
        async function pump(): Promise<any> {
            console.log('pump')
            let toAdd = arrayBuffer.shift()
            if (!toAdd) {
                const {done, value} = await reader.read()
                if (done) {
                    console.log('dead')
                    //clearInterval(interval)
                    return
                }
                toAdd = value
            }
            
            
            //arrayBuffer.push(value)
            if (buffer.buffered.length !== 0) {
            console.log(buffer.buffered.start(0))
                console.log(buffer.buffered.end(0))
            }
            try {
                buffer.appendBuffer(toAdd)                
            } catch (err) {
                console.log('errored')
                arrayBuffer.push(toAdd)
                setTimeout(pump, 10000)
                return
            }
            await new Promise<void>((res, rej) => {
                buffer.onupdate = () => res()
            })

            return await pump()
            //if (cold && buffer.buffered.length === 0) {
            //    cold = false
            //    setTimeout(pump, 1000)
            //} else {
                
            //    setTimeout(pump, (buffer.buffered.end(0)*1000 - audio.currentTime*1000) - 1000)
            //}
            
            
        }
        /*interval = setInterval(() => {
            if (arrayBuffer.length !== 0 && buffer.updating === false) {
                if (buffer.buffered.length === 1) {
                    console.log(audio.currentTime)
                    console.log(buffer.buffered.start(0))
                    console.log(buffer.buffered.end(0))
                    if ((buffer.buffered.end(0) - buffer.buffered.start(0)) >= 10) {
                        if (audio.currentTime >= (buffer.buffered.start(0) + 5)) {
                            buffer.remove(buffer.buffered.start(0), buffer.buffered.end(0) - 4)
                            console.log("TRIMMED")
                        return
                        }
                    }
                }
                buffer.appendBuffer(arrayBuffer.shift()!)
            }
        }, 1000)*/
        return pump()
    })
})





window.elevenlabsApi.toClose(() => window.close())

