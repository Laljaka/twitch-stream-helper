/** @type {string} */
let context

const modules = document.querySelectorAll('.inactive')

modules.forEach(async (module, key) => {
    module.addEventListener('click', () => {
        document.getElementById('aaa').style.top = `${(70 * key) + 25}px`
        const previousReference = document.getElementById(`-${context}`)
        if (previousReference) previousReference.style.display = 'none'
        context = module.id
        const settingsReference = document.getElementById(`-${context}`)
        settingsReference.style.display = 'grid'
    })

    window.mainApi.toConsole(module.id, (v) => {
        const ref = document.getElementById(`-${module.id}`).querySelector('samp')
        const spn = document.createElement('span')
        spn.innerText = `${module.id}:> ${v}`
        ref.appendChild(spn)
    })
  /*
  const form = document.getElementById(`-${module.id}`)!.querySelector('form')!
  const mod = api.storage[module.id as keyof MultiModuleStorage]
  for (let elem of form.elements) {
    if (elem instanceof HTMLInputElement && elem.name in mod) {
      elem.value = mod[elem.name as keyof typeof mod]
    }
  }*/
})

for (let key in window.mainApi.storage) {
    const form = document.getElementById(`-${key}`).querySelector('form')
    const mod = window.mainApi.storage[key]
    for (let name in mod) {
        const test = mod[name]
        const inp = form.querySelector(`[name="${name}"]`)
        if (inp instanceof HTMLInputElement) {
            if (typeof test === 'boolean') inp.checked = test 
            else inp.value = test
        }
    }
}

const cSwitches = document.querySelectorAll(".switch")

cSwitches.forEach((cSwitch) => {
    const checkbox = cSwitch.querySelector('input')
    checkbox.checked = false
    /** @type {HTMLElement} */
    const thumb = cSwitch.querySelector('.thumb')
    const moduleReference = cSwitch.parentElement.parentElement.dataset['id']
    checkbox.addEventListener('change', async (ev) => {
        checkbox.disabled = true
        thumb.style.setProperty('--outline', 'yellow')
        document.getElementById(moduleReference).style.setProperty('--before-color', "yellow")
        if (checkbox.checked) {
            await window.mainApi.startModule(moduleReference).catch((e) => console.log(e))
            thumb.style.setProperty('--outline', "lime")
            document.getElementById(moduleReference).style.setProperty('--before-color', "lime")
            checkbox.disabled = false
        } else {
            await window.mainApi.stopModule(moduleReference)
            thumb.style.setProperty('--outline', "red")
            document.getElementById(moduleReference).style.setProperty('--before-color', "red")
            checkbox.disabled = false
        }
    })
})

const fformList = document.querySelectorAll('form')

fformList.forEach((fform) => {
    fform.addEventListener('submit', (ev) => {
        ev.preventDefault()
        //const ref = ev.currentTarget
        const ctx = fform.parentElement.parentElement.dataset['id']
        //const lenght = ref.elements.length
        const toSend = {}
        for (let elem of fform.elements) {
            if (elem instanceof HTMLInputElement && elem.type !== 'submit' && elem.type !== 'button' && elem.className !== 'reveal') {
                if (elem.type === 'checkbox') toSend[elem.name] = elem.checked
                else toSend[elem.name] = elem.value
            } 
        }
        window.mainApi.save(ctx, toSend)
    })
})

/** @type {NodeListOf<HTMLInputElement>} */
const reveals = document.querySelectorAll('.reveal')
reveals.forEach((v) => {
    v.addEventListener('change', (ev) => {
        //const ref = ev.currentTarget
        const prev = v.previousElementSibling
        //ref.style.setProperty('--svg', ref.checked? 'url("../content/eye.svg")' : 'url("../content/eye-slash.svg")')
        //@ts-ignore
        prev.type = v.checked? 'text' : "password"
    })
})

//TODO: MODULES SHOULD NOT WORK WITHOUT API

