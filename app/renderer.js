const menu = document.querySelector('menu')

/** @type {import("./shared_types.d.ts").Send} */
const dataFromMain = await window.mainApi.loadData()


const promises = []
console.log('before')

const mainElement = document.querySelector('main')

for (const key in dataFromMain) {
    const ref = document.createElement('li')
    ref.id = key
    ref.className = 'inactive'
    ref.innerHTML = `<h3>${dataFromMain[key].displayName}</h3>`
    menu.prepend(ref)

    const settings = document.createElement('div')
    settings.className = 'module-settings'
    settings.id = `-${key}`
    settings.dataset['id'] = key
    settings.innerHTML = `
    <fieldset class="wrapper setting"><legend>Settings</legend>
        <form action=""></form>
    </fieldset>
    <fieldset class="wrapper setting"><legend>Controls</legend>
        <label class="switch">
            <input type="checkbox">
            <span class="thumb"></span>
        </label>
    </fieldset>
    <samp class="wrapper">
        <span>${dataFromMain[key].displayName} :> </span>
    </samp>`
    mainElement.appendChild(settings)

    const form = settings.querySelector('form')
    const prom = window.mainApi.loadHTML(key).then((htttml) => {
        form.innerHTML = htttml
        form.querySelectorAll("input[type='password']").forEach((inp) => {
            const hide = document.createElement('input')
            hide.type = 'checkbox'
            hide.className = 'reveal'
            inp.after(hide)//`<input type="checkbox" class="reveal">`)
        }) 
    })

    promises.push(prom)
}

await Promise.all(promises)

console.log('after')
/** @type {string} */
let context

const modules = document.querySelectorAll('.inactive')
const aaa = document.getElementById('aaa')

modules.forEach((module, key) => {
    const form = document.getElementById(`-${module.id}`).querySelector('form')
    /** @type {import("./shared_types.d.ts").ModuleStorage} */
    const mod = dataFromMain[module.id].storage
    for (let name in mod) {
        const test = mod[name]
        const inp = form.querySelector(`[name="${name}"]`)
        if (inp instanceof HTMLInputElement) {
            if (typeof test === 'boolean') inp.checked = test 
            else inp.value = test
        }
    }

    module.addEventListener('click', () => {
        aaa.style.top = `${(70 * key) + 25}px`
        const previousReference = document.getElementById(`-${context}`)
        if (previousReference) previousReference.style.display = 'none'
        context = module.id
        const settingsReference = document.getElementById(`-${context}`)
        settingsReference.style.display = 'grid'
    })
})

window.mainApi.toConsole((from, v) => {
    const ref = document.getElementById(`-${from}`).querySelector('samp')
    const spn = document.createElement('span')
    spn.innerText = `${dataFromMain[from].displayName} :> ${v}`
    ref.appendChild(spn)
})

window.mainApi.stateUpdate((from, state) => {
    const ref = document.getElementById(`-${from}`).querySelector('.switch')
    /** @type {HTMLElement} */
    const thumb = ref.querySelector('.thumb')
    const checkbox = ref.querySelector('input')
    if (state === true) {
        thumb.style.setProperty('--outline', "lime")
        document.getElementById(from).style.setProperty('--before-color', "lime")
        checkbox.disabled = false
        if (!checkbox.checked) checkbox.checked = true
    } else {
        thumb.style.setProperty('--outline', "red")
        document.getElementById(from).style.setProperty('--before-color', "red")
        checkbox.disabled = false
        if (checkbox.checked) checkbox.checked = false
    }
})

const cSwitches = document.querySelectorAll(".switch")

cSwitches.forEach((cSwitch) => {
    const checkbox = cSwitch.querySelector('input')
    checkbox.checked = false
    /** @type {HTMLElement} */
    const thumb = cSwitch.querySelector('.thumb')
    const mref = cSwitch.parentElement.parentElement
    const fref = mref.querySelector('form')
    const moduleReference = mref.dataset['id']
    checkbox.addEventListener('change', (ev) => {
        if (checkbox.checked) {
            if (!fref.reportValidity()) {
                checkbox.checked = false
                return
            }
        }
        checkbox.disabled = true
        thumb.style.setProperty('--outline', 'yellow')
        document.getElementById(moduleReference).style.setProperty('--before-color', "yellow")
        checkbox.checked? window.mainApi.startModule(moduleReference) : window.mainApi.stopModule(moduleReference)
    })
})



const fformList = document.querySelectorAll('form')

fformList.forEach((fform) => {
    for (let elem of fform.elements){
        const ctx = fform.parentElement.parentElement.dataset['id']
        if (elem instanceof HTMLInputElement && elem.type !== 'submit' && elem.type !== 'button' && elem.className !== 'reveal') {
            const ref = elem
            if (ref.type === 'checkbox') ref.addEventListener('input', () => window.mainApi.save(ctx, ref.name, ref.checked))
            else ref.addEventListener('input', () => window.mainApi.save(ctx, ref.name, ref.value))
        }
    }
})

/** @type {NodeListOf<HTMLInputElement>} */
const reveals = document.querySelectorAll('.reveal')
reveals.forEach((v) => {
    v.addEventListener('change', (ev) => {
        //const ref = ev.currentTarget
        const prev = v.previousElementSibling
        //ref.style.setProperty('--svg', ref.checked? 'url("../content/eye.svg")' : 'url("../content/eye-slash.svg")')
        if (prev instanceof HTMLInputElement) prev.type = v.checked? 'text' : "password"
    })
})

//TODO: MODULES SHOULD NOT WORK WITHOUT API

