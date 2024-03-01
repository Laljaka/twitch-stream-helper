let context: string | null = null

const modules = document.querySelectorAll('.inactive') as NodeListOf<HTMLElement>

declare const api: {
  storage: MultiModuleStorage
  startModule: (v: ModuleName) => Promise<void>,
  stopModule: (v: ModuleName) => Promise<void>
  toConsole: (v: ModuleName, callback: Function) => Electron.IpcRenderer
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

  api.toConsole(module.id as ModuleName, (v: string) => {
    const ref = document.getElementById(`-${module.id}`)!.querySelector('samp') as HTMLElement
    const spn = document.createElement('span')
    spn.innerText = `TwitchPubSub:> ${v}`
    ref.appendChild(spn)
  })

  const formToUpdate = document.getElementById(`-${module.id}`)!.querySelector('form') as HTMLFormElement
  const len = formToUpdate.elements.length
  for (let i =0; i < len; i++) {
    const elem = formToUpdate.elements[i]
    if (elem instanceof HTMLInputElement && elem.type !== 'submit' && elem.type !== 'button' && elem.className !== 'reveal') {
      if (elem.type !== 'checkbox') {
        if (elem.name in api.storage[module.id as keyof MultiModuleStorage]) {
          // @ts-ignore
          elem.value = api.storage[module.id][elem.name]
        }
      }
    } 
  }
})

const cSwitches = document.querySelectorAll(".switch") as NodeListOf<HTMLElement>

for (let cSwitch of cSwitches) {
  const checkbox = cSwitch.querySelector('input') as HTMLInputElement
  checkbox.checked = false
  const thumb = cSwitch.querySelector('.thumb') as HTMLSpanElement
  const moduleReference = cSwitch.parentElement!.parentElement!.dataset['id'] as ModuleName
  checkbox.addEventListener('change', async (ev) => {
    checkbox.disabled = true
    thumb.style.setProperty('--outline', 'yellow')
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

const fformList = document.querySelectorAll('form') as NodeListOf<HTMLFormElement>

fformList.forEach((fform) => {
  fform.addEventListener('submit', (ev) => {
    ev.preventDefault()
    const ref = ev.currentTarget as HTMLFormElement
    const ctx = ref.parentElement!.parentElement!.id
    const lenght = ref.elements.length
    for (let i=0; i<lenght; i++) {
      const elem = ref.elements[i]
      if (elem instanceof HTMLInputElement && elem.type !== 'submit' && elem.type !== 'button' && elem.className !== 'reveal') {
        if (elem.type === 'checkbox') console.log(ctx, elem.name, elem.checked)
        else console.log(ctx, elem.name, elem.value)
      } 
    }
  })
})

const reveals = document.querySelectorAll('.reveal') as NodeListOf<HTMLInputElement>
reveals.forEach((v) => {
  v.addEventListener('change', (ev) => {
    const ref = ev.currentTarget as HTMLInputElement
    const prev = ref.previousElementSibling as HTMLInputElement
    //ref.style.setProperty('--svg', ref.checked? 'url("../content/eye.svg")' : 'url("../content/eye-slash.svg")')
    prev.type = ref.checked? 'text' : "password"
  })
})

//TODO: MODULES SHOULD NOT WORK WITHOUT API

