let context = 'base'

const settings = document.getElementById('settings')

const modules = document.querySelectorAll('.inactive')

modules.forEach(async (module, key) => {
  module.addEventListener('click', async() => {
    context = module.id
    document.getElementById('aaa').style.top = `${(-70 * (modules.length - key))}px`
  })
})

document.getElementById('websocket').style.setProperty('--before-color', "yellow")
