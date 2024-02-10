let context = null

const modules = document.querySelectorAll('.inactive')



modules.forEach(async (module, key) => {
  module.addEventListener('click', async() => {
    document.getElementById('aaa').style.top = `${(70 * key) + 25}px`
    const previousReference = document.getElementById(`-${context}`)
    if (previousReference) previousReference.style.display = 'none'
    context = module.id
    const settingsReference = document.getElementById(`-${context}`)
    settingsReference.style.display = 'grid'
  })
})

document.getElementById('websocket').style.setProperty('--before-color', "yellow")
