import { ipcRenderer } from 'electron/renderer'


let timeout: NodeJS.Timeout

let socket = connect()

//TODO explore this reference of a websocket in the callback of the event listener


let SID = ""

function connect(url = 'wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=100') {
    const s = new WebSocket(url)
    s.addEventListener('open', opened)
    s.addEventListener('message', message)
    return s
}

function disconnect(s: WebSocket) {
    s.removeEventListener("open", opened)
    s.removeEventListener("message", message)
    s.close()
}

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
    send('Connection lost, recconecting...')
    clearTimeout(timeout)
    disconnect(socket)
    if (reconnect_url !== null) {
        socket = connect(reconnect_url)
    } else {
        socket = connect()
    }
}

function opened() {
    send("Connected to Twitch")
}

async function message(data: MessageEvent<any>) {
    let json = JSON.parse(data.data)
    switch (json.metadata.message_type) {
        case "session_welcome":
            if (SID !== json.payload.session.id) {
                send('Received session ID, subscribing to events...')
                SID = json.payload.session.id
                await unsub().catch((e) => send(e))
                await sub().catch((e) => send(e))
                send('Subscribed to events!')
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
        disconnect(socket)
        window.close()    
})

function send(data: string) {
    ipcRenderer.send('stdout', {from: 'twitchpubsub', data: data})
}