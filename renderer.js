//---------------STATIC EVERY TIME------------------------
const startButton = document.createElement('button')
startButton.textContent = "Start"
startButton.className = 'control-button'
startButton.onclick = () => {
  window.api.startModule(context)
}

const stopButton = document.createElement('button')
stopButton.textContent = 'Stop'
stopButton.className = 'control-button'
stopButton.onclick = () => {
  window.api.stopModule(context)
}

const startStopHolder = document.createElement('div')
startStopHolder.className = "infoHolder"
startStopHolder.id = 'startStop'
startStopHolder.appendChild(startButton)
startStopHolder.appendChild(stopButton)

const col = {}

//----------------TWITCH API PART---------------------------
const accessKeyInput = document.createElement('input')
accessKeyInput.type = 'password'
accessKeyInput.id = 'accessToken'

const clientIdInput = document.createElement("input")
clientIdInput.type = 'password'
clientIdInput.id = 'clientId'

const submitButtonTwitch = document.createElement('button')
submitButtonTwitch.textContent = "Submit"
submitButtonTwitch.className = "control-button"

col.websocket =  document.createElement('div')
col.websocket.className = "infoHolder"
col.websocket.id = 'credentials'
col.websocket.appendChild(accessKeyInput)
col.websocket.appendChild(clientIdInput)
col.websocket.appendChild(submitButtonTwitch)



//----------------HTTP SERVER PART--------------------------
const hostInput = document.createElement('input')
hostInput.type = 'text'
hostInput.id = 'host'

const portInput = document.createElement('input')
portInput.type = 'text'
portInput.id = "port"

const submitButtonHttp = document.createElement('button')
submitButtonHttp.textContent = "Submit"
submitButtonHttp.className = "control-button"

col.http = document.createElement('div')
col.http.className = "infoHolder"
col.http.id = 'serverData'
col.http.appendChild(hostInput)
col.http.appendChild(portInput)
col.http.appendChild(submitButtonHttp)





let context = 'base'

const settings = document.getElementById('settings-wrapper')

const modules = document.querySelectorAll('.inactive')

modules.forEach(async (module, key) => {
  module.addEventListener('click', async() => {
    context = module.id
    document.getElementById('aaa').style.top = `${(-70 * (modules.length - key))}px`
    settings.replaceChildren(startStopHolder, col[context])
  })
})


