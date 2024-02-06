const { ipcRenderer } = require('electron/renderer')

let timeout

let socket = new WebSocket('wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=100')
addListeners()

let SID = ""

async function unsub() {
    let response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
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
    socket.removeAllListeners()
    socket.close()
    socket = null
    if (reconnect_url !== null) {
        socket = new WebSocket(reconnect_url)
        addListeners()
    } else {
        socket = new WebSocket('wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=100')
        addListeners()
    }
}

function addListeners() {
    socket.addEventListener('open', async function opened() {
        ipcRenderer.send('websocket', {
            type: "log",
            message: "connection open"
        })
    })

    socket.addEventListener('message', async function message(data) {
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
})
}


ipcRenderer.on('websocket', (_, m) => {
    if (m === "close") {
        socket.close()
        socket.removeAllListeners()
        socket = null
        process.exit()
    }
})