import { TimeLogger, createElementOneLine, generatePasswordReveals, 
        generateQueryAllowed, handleFileInput, yeildParents } from "./renderer.helpers.js"

const l = new TimeLogger(false)

const menu = document.querySelector('menu')

/** @type {import("./shared_types.d.ts").Send} */
const dataFromMain = await window.mainApi.loadData()
l.log('data loaded')

const allowedInputs = ['[type=checkbox]', '[type=password]', '[type=number]', '[type=file]', '[type=url]']
const allowedElements = ['input', 'label', 'span']


/** 
 * @param {HTMLInputElement} elem  
 * @returns {string | boolean}
 */
function deduceReturnType(elem) {
    if (elem.type === 'checkbox') return elem.checked
    else return elem.value
}

l.log('starting loading')

const mainElement = document.querySelector('main')

for (const componentName in dataFromMain) {
    const li = createElementOneLine('li', {id: componentName, className: 'inactive'})
    li.innerHTML = `<h3>${dataFromMain[componentName].displayName}</h3>`
    menu.prepend(li)

    const settings = createElementOneLine('div', {id:`-${componentName}`, className: 'component-settings'})
    settings.dataset['id'] = componentName
    settings.innerHTML = `
    <fieldset class="wrapper setting" id="target"><legend>Settings</legend>
    </fieldset>
    <fieldset class="wrapper setting"><legend>Controls</legend>
        <label class="switch">
            <input type="checkbox">
            <span class="thumb"></span>
        </label>
    </fieldset>
    <samp class="wrapper">
        <span>${dataFromMain[componentName].displayName} :> </span>
    </samp>`
    mainElement.appendChild(settings)
    l.log(`${componentName} html loaded`)

    const fieldset = settings.querySelector('#target')
    const form = document.createElement('form')
    form.dataset['id'] = componentName
    form.innerHTML = dataFromMain[componentName].html
    l.log(`${componentName} inner html loaded`)

    const cSwitch = settings.querySelector('.switch')
    const switchInput = cSwitch.querySelector('input')
    switchInput.checked = false
    /** @type {HTMLElement} */
    const thumb = cSwitch.querySelector('.thumb')
    switchInput.addEventListener('change', (ev) => {
        if (switchInput.checked) {
            if (!form.reportValidity()) {
                switchInput.checked = false
                return
            }
        }
        switchInput.disabled = true
        thumb.style.setProperty('--outline', 'yellow')
        li.style.setProperty('--before-color', "yellow")
        window.mainApi.controlComponent(switchInput.checked, componentName)
    })

    l.log(`${componentName} switches loaded`)

    form.querySelectorAll(generateQueryAllowed('*', allowedElements)).forEach((elem) => elem.remove())

    // clean up html
    form.querySelectorAll(generateQueryAllowed('input', allowedInputs)).forEach((elem) => elem.remove())
    l.log(`${componentName} cleaned up`)

    form.querySelectorAll("input[type=password]").forEach((inp) => generatePasswordReveals(inp))
    l.log(`${componentName} reveals set up`)

    form.querySelectorAll("input[type=file]").forEach((element) => handleFileInput(element))
    l.log(`${componentName} file inputs set up`)

    for (const elem of form.elements){
        if (elem instanceof HTMLInputElement && elem.className !== 'reveal') {
            const newElem = elem
            newElem.addEventListener('input', () => window.mainApi.save(componentName, newElem.name, deduceReturnType(newElem)))
        }
    }
    l.log(`${componentName} saving set up`)

    fieldset.append(form)
}

l.log('all preloaded')
/** @type {string} */
let context

const components = document.querySelectorAll('.inactive')
const aaa = document.getElementById('aaa')

components.forEach((component, key) => {
    const form = document.getElementById(`-${component.id}`).querySelector('form')
    /** @type {import("./shared_types.d.ts").ComponentStorage} */
    const mod = dataFromMain[component.id].storage
    for (let name in mod) {
        const test = mod[name]
        const inp = form.querySelector(`[name="${name}"]`)
        if (inp instanceof HTMLInputElement) {
            if (typeof test === 'boolean') inp.checked = test 
            else inp.value = test
        }
    }

    component.addEventListener('click', () => {
        aaa.style.top = `${(70 * key) + 25}px`
        const previousReference = document.getElementById(`-${context}`)
        if (previousReference) previousReference.style.display = 'none'
        context = component.id
        const settingsReference = document.getElementById(`-${context}`)
        settingsReference.style.display = 'grid'
    })
})

l.log('additional set up')

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

l.log('registering api calls')

window.addEventListener('contextmenu', async (ev) => {
    if (!(ev.target instanceof Element)) return
    const arr = [...yeildParents(ev.target)]
    const resp = await window.mainApi.openContext(ev.x, ev.y, arr.map((el) => el.tagName))
    console.log(resp)
    if (resp === 'clear') {
        const parent = arr.find((el) => el.tagName === 'FORM')
        if (!(parent instanceof HTMLFormElement)) return
        for (const el of parent.elements) {
            if (el instanceof HTMLInputElement) {
                if (el.type === 'checkbox') {
                    el.checked = false
                    el.dispatchEvent(new Event('input', { bubbles: true }) )
                } else {
                    el.value = ''
                    el.dispatchEvent(new Event('input', { bubbles: true }))
                }
            }
        }
    }
    
})





//TODO: MODULES SHOULD NOT WORK WITHOUT API

//TODO: PASSIVE EVENTS


l.end()
