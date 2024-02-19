let context: string | null = null

const modules = document.querySelectorAll('.inactive') as NodeListOf<HTMLElement>


modules.forEach(async (module, key) => {
  module.addEventListener('click', async() => {
    document.getElementById('aaa')!.style.top = `${(70 * key) + 25}px`
    const previousReference = document.getElementById(`-${context}`)
    if (previousReference) previousReference.style.display = 'none'
    context = module.id
    const settingsReference = document.getElementById(`-${context}`)!
    settingsReference.style.display = 'grid'
  })
})

document.getElementById('websocket')!.style.setProperty('--before-color', "yellow")

const cSwitches = document.querySelectorAll(".switch") as NodeListOf<HTMLElement>

for (let cSwitch of cSwitches) {
  const checkbox = cSwitch.querySelector('input') as HTMLInputElement
  checkbox.addEventListener('change', (ev) => {
    checkbox.disabled = true
    const thumb = cSwitch.querySelector('.thumb') as HTMLInputElement 
    thumb.style.setProperty('--outline', 'yellow')
    setTimeout(() => {
      checkbox.disabled = false
      thumb.style.setProperty('--outline', checkbox.checked ? "lime" : "red")
    }, 4000);
  })
}