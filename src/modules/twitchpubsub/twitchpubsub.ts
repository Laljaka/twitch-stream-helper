import { ipcRenderer } from 'electron/renderer'


let timeout: NodeJS.Timeout

let socket = new WebSocket('wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=100')

//TODO explore this reference of a websocket in the callback of the event listener
socket.addEventListener('open', opened)
socket.addEventListener('message', message)

let SID = ""

async function unsub() {
    let response: any | Response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
        method: "GET",
        headers: {
            "Authorization": "Bearer ",
            "Client-Id": "",
            "Content-Type": "application/json"
        }

    })
    response = await response.json()
    if (response.total !== 0) {
        for (let subs of response.data) {
            await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${subs.id}`, {
                        method: "DELETE",
                        headers: {
                            "Authorization": "Bearer ",
                            "Client-Id": "",
                            "Content-Type": "application/json"
                        }}
            )
        }
    }
    return response
}

async function sub() {
    let response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
        method: "POST",
        headers: {
            "Authorization": "Bearer ",
            "Client-Id": "",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            type: "channel.channel_points_custom_reward_redemption.add",
            version: "1",
            condition: {
                broadcaster_user_id: "51633440"
            },
            transport: {
                method: "websocket",
                session_id: `${SID}`
            }
        })
    })
    response = await response.json()
    return response
}

// TODO check if reconnected websocket registers events
function reconnect(reconnect_url = null) {
    clearTimeout(timeout)
    socket.removeEventListener("open", opened)
    socket.removeEventListener("message", message)
    socket.close()
    if (reconnect_url !== null) {
        socket = new WebSocket(reconnect_url)
        socket.addEventListener('open', opened)
        socket.addEventListener('message', message)
    } else {
        socket = new WebSocket('wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=100')
        socket.addEventListener('open', opened)
        socket.addEventListener('message', message)
    }
}

async function opened() {
    ipcRenderer.send('websocket', {
        type: "log",
        message: "connection open"
    })
}

async function message(data: MessageEvent<any>) {
    let json = JSON.parse(data.data)
    switch (json.metadata.message_type) {
        case "session_welcome":
            if (SID !== json.payload.session.id) {
                SID = json.payload.session.id
                console.log(await unsub())
                console.log(await sub())
            }
            timeout = setTimeout(reconnect, 100000)
            break
        case "session_reconnect":
            reconnect(json.payload.session.reconnect_url)
            break
        case "session_keepalive":
            clearTimeout(timeout)
            timeout = setTimeout(reconnect, 100000)
            break
        case "notification":
            clearTimeout(timeout)
            timeout = setTimeout(reconnect, 100000)
            switch (json.payload.event.reward.title) {
                case "Spin the rat right!":
                    ipcRenderer.send('websocket', { type: "data", to: "3d", message: { axis: "y" , amount: 0.15 } })
                    break
                case "Spin the rat up!":
                    ipcRenderer.send('websocket', { type: "data", to: "3d", message: { axis: "x" , amount: -0.15 } })
                    break
                case "Spin the rat down!":
                    ipcRenderer.send('websocket', { type: "data", to: "3d", message: { axis: "x" , amount: 0.15 } })
                    break
                case "Spin the rat left!":
                    ipcRenderer.send('websocket', { type: "data", to: "3d", message: { axis: "y" , amount: -0.15 } })
                    break
                case "TTS Glukhar from Tarkov":
                    ipcRenderer.send('websocket', { type: "data", to: "AI", message: { voice: "Glukhar" , text: json.payload.event.user_input } })
                    break
                case "TTS Birdeye from Tarkov":
                    ipcRenderer.send('websocket', { type: "data", to: "AI", message: { voice: "Birdeye" , text: json.payload.event.user_input } })
                    break
            }
            break
        default:
            clearTimeout(timeout)
            timeout = setTimeout(reconnect, 100000)
            console.log(json)
    }
}

ipcRenderer.on('close', () => {
        socket.close()
        socket.removeEventListener("open", opened)
        socket.removeEventListener("message", message)
        window.close()    
})