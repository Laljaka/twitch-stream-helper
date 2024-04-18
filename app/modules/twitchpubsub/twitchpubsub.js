/** @type {NodeJS.Timeout} */
let timeout

const credentials = JSON.parse(window.twitchpubsubApi.credentials)

window.addEventListener('error', (ev) => {
    shutdown(ev.message)
})

let socket = connect()
//TODO explore this reference of a websocket in the callback of the event listener

let SID = ""

function connect(url = 'wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=100') {
    const s = new WebSocket(url)
    s.addEventListener('open', opened)
    s.addEventListener('message', message)
    return s
}

/** @param {WebSocket} s  */
function disconnect(s) {
    s.removeEventListener("open", opened)
    s.removeEventListener("message", message)
    s.close()
}

async function unsub() {
    const raw = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${credentials['access']}`,
            "Client-Id": credentials['clientid'],
            "Content-Type": "application/json"
        }

    })
    const response = await raw.json()
    if ('error' in response) throw new Error(response.error)
    if (response.total !== 0) {
        for (let subs of response.data) {
            await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${subs.id}`, {
                        method: "DELETE",
                        headers: {
                            "Authorization": `Bearer ${credentials['access']}`,
                            "Client-Id": credentials['clientid'],
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
            "Authorization": `Bearer ${credentials['access']}`,
            "Client-Id": credentials['clientid'],
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
    window.twitchpubsubApi.stdout('Connection lost, recconecting...')
    clearTimeout(timeout)
    disconnect(socket)
    if (reconnect_url) {
        socket = connect(reconnect_url)
    } else {
        socket = connect()
    }
}

function opened() {
    window.twitchpubsubApi.stdout("Connected to Twitch")
}

/** @param {MessageEvent<any>} data  */
async function message(data) {
    let json = JSON.parse(data.data)
    switch (json.metadata.message_type) {
        case "session_welcome":
            if (SID !== json.payload.session.id) {
                window.twitchpubsubApi.stdout('Received session ID, subscribing to events...')
                SID = json.payload.session.id
                await unsub().catch((err) => shutdown(err))
                await sub().catch((err) => shutdown(err))
                window.twitchpubsubApi.stdout('Subscribed to events!')
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
                    window.twitchpubsubApi.sender({ axis: "y" , amount: 1 })
                    break
                case "Spin the rat up!":
                    window.twitchpubsubApi.sender({ axis: "x" , amount: -1 })
                    break
                case "Spin the rat down!":
                    window.twitchpubsubApi.sender({ axis: "x" , amount: 1 })
                    break
                case "Spin the rat left!":
                    window.twitchpubsubApi.sender({ axis: "y" , amount: -1 })
                    break
                case "TTS Glukhar from Tarkov":
                    window.twitchpubsubApi.sender({ voice: "Glukhar" , text: json.payload.event.user_input })
                    break
                case "TTS Birdeye from Tarkov":
                    window.twitchpubsubApi.sender({ voice: "Birdeye" , text: json.payload.event.user_input })
                    break
            }
            break
        default:
            clearTimeout(timeout)
            timeout = setTimeout(reconnect, 100000)
            console.log(json)
    }
}


window.twitchpubsubApi.ready()


//TODO explore window refs inside callbacks 
/** @param {string} [reason]  */
function shutdown(reason) {
    if (reason) window.twitchpubsubApi.stdout(reason)
    disconnect(socket)
    window.close() 
}

