let context: string | null = null

const modules = document.querySelectorAll('.inactive') as NodeListOf<HTMLElement>

declare const api: {
  startModule: (v: ModuleName) => Promise<void>,
  stopModule: (v: ModuleName) => Promise<void>
}

modules.forEach(async (module, key) => {
  module.addEventListener('click', () => {
    document.getElementById('aaa')!.style.top = `${(70 * key) + 25}px`
    const previousReference = document.getElementById(`-${context}`)
    if (previousReference) previousReference.style.display = 'none'
    context = module.id
    const settingsReference = document.getElementById(`-${context}`)!
    settingsReference.style.display = 'grid'
  })
})

const cSwitches = document.querySelectorAll(".switch") as NodeListOf<HTMLElement>

for (let cSwitch of cSwitches) {
  const checkbox = cSwitch.querySelector('input') as HTMLInputElement
  checkbox.checked = false
  checkbox.addEventListener('change', async (ev) => {
    checkbox.disabled = true
    const thumb = cSwitch.querySelector('.thumb') as HTMLSpanElement 
    thumb.style.setProperty('--outline', 'yellow')
    const moduleReference = cSwitch.parentElement!.parentElement!.id.slice(1) as ModuleName
    document.getElementById(moduleReference)!.style.setProperty('--before-color', "yellow")
    if (checkbox.checked) {
      await api.startModule(moduleReference)
      thumb.style.setProperty('--outline', "lime")
      document.getElementById(moduleReference)!.style.setProperty('--before-color', "lime")
      checkbox.disabled = false
    } else {
      await api.stopModule(moduleReference)
      thumb.style.setProperty('--outline', "red")
      document.getElementById(moduleReference)!.style.setProperty('--before-color', "red")
      checkbox.disabled = false
    }
  })
}

const fform = document.getElementById('test') as HTMLFormElement

fform.addEventListener('submit', (ev) => {
  ev.preventDefault()
  console.log(ev)
})
