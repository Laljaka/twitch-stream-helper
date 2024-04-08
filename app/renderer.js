class TimeLogger {
    state
    doodad
    enabled
    /** @param {boolean} enabled  */
    constructor(enabled) {
        this.state = true
        this.doodad = 'time'
        this.enabled = enabled
    }

    /** @param {string} [args]  */
    log(args) {
        if (!this.enabled) return
        
        this.state? console.time(this.doodad) : console.timeLog(this.doodad, args)
        this.state = false
    }
}

const l = new TimeLogger(true)

const menu = document.querySelector('menu')

l.log()

/** @type {import("./shared_types.d.ts").Send} */
const dataFromMain = await window.mainApi.loadData()
l.log('data loaded')

const allowedInputs = ['[type=checkbox]', '[type=password]', '[type=number]', '[type=file]', '[type=url]']
const allowedElements = ['input', 'label', 'span']

/**
 * @param {string} forr 
 * @param {Array<string>} allowed 
 * @returns 
 */
function generateQueryAllowed(forr, allowed) {
    let res = `${forr}:not(`
    for (const dis of allowed) {
        res = res.concat(`${dis}, `)
    }
    res = res.slice(0, -2)
    res = res.concat(')')
    return res
}

/** 
 * @param {HTMLInputElement} elem  
 * @returns {string | boolean}
 */
function deduceReturnType(elem) {
    if (elem.type === 'checkbox') return elem.checked
    else return elem.value
}

const promises = []
l.log('starting loading')

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
    <fieldset class="wrapper setting" id="target"><legend>Settings</legend>
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
    l.log(`${key} html loaded`)

    const fieldset = settings.querySelector('#target')
    const prom = window.mainApi.loadHTML(key).then((htttml) => {
        const form = document.createElement('form')
        form.dataset['id'] = key
        form.innerHTML = htttml
        l.log(`${key} inner html loaded`)

        form.querySelectorAll(generateQueryAllowed('*', allowedElements)).forEach((elem) => {
            console.log(elem)
            elem.remove()
        })

        // clean up html
        form.querySelectorAll(generateQueryAllowed('input', allowedInputs)).forEach((elem) => {
            console.log(elem)
            elem.remove()
        })
        l.log(`${key} cleaned up`)

        form.querySelectorAll("input[type=password]").forEach((inp) => generatePasswordReveals(inp))
        l.log(`${key} reveals set up`)

        form.querySelectorAll("input[type=file]").forEach((element) => handleFileInput(element))
        l.log(`${key} file inputs set up`)

        for (let elem of form.elements){
            if (elem instanceof HTMLInputElement && elem.className !== 'reveal') {
                const newElem = elem
                newElem.addEventListener('input', () => { 
                    console.log(key, newElem.name, 'input')
                    window.mainApi.save(key, newElem.name, deduceReturnType(newElem))
                })
            }
        }
        l.log(`${key} saving set up`)

        fieldset.append(form)
    })

    promises.push(prom)
}

await Promise.all(promises)

l.log('all preloaded')
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

l.log('switches')

/** @param {Element} elem  */
function generatePasswordReveals(elem) {
    if (!(elem instanceof HTMLInputElement)) return
    const hide = createElementOneLine('input', {type: 'checkbox', className: 'reveal'})

    hide.addEventListener('change', (_) => {
        elem.type = hide.checked? 'text' : "password"
    })

    elem.after(hide)
}

/** @param {Element} element  */
function handleFileInput(element) {
    if (!(element instanceof HTMLInputElement)) return
    const button = document.createElement('button')
    button.type = 'button'
    //button.className = 'fakeButton'
    const hidden = document.createElement('input')
    hidden.type = 'hidden'
    const test = element.dataset['extensions'].split(', ')
    hidden.name = element.name
    button.innerText = element.placeholder
    button.addEventListener('click', async (_) => {
        //ev.preventDefault()
        const response = (await window.mainApi.openFile({ title: "Open", properties: ['openFile'], filters: [{name: test[0], extensions: test}]}))
        if (!response.canceled) {
            hidden.value = response.filePaths[0]
            hidden.dispatchEvent(new Event('input', { bubbles: true }))
        }
    })
    element.after(hidden)
    element.after(button)
    element.remove()
}

window.addEventListener('contextmenu', async (ev) => {
    /*
    if (!(ev.target instanceof Element)) return
    console.log([...yeildParents(ev.target)])
    /*
    for (const parent of yeildParents(ev.target)) {
        if (!(parent instanceof HTMLFormElement)) continue
        const resp = await window.mainApi.openContext(ev.x, ev.y, parent.dataset['id'])
        if (resp === 'clear') {
            for (const el of parent.elements) {
                if (el instanceof HTMLInputElement) {
                    if (el.type === 'checkbox') {
                        el.checked = false
                    else el.value = ''
                }
            }
        }
        break
    }*/
    
})

/**
 * @template {keyof HTMLElementTagNameMap} K 
 * @param {K} type 
 * @param {import("./shared_types.d.ts").ElementOptions} options 
 * @returns {HTMLElementTagNameMap[K]}
 */
function createElementOneLine(type, options) {
    const el = document.createElement(type)
    if (options.id) el.id = options.id
    if ((el instanceof HTMLInputElement || el instanceof HTMLButtonElement) && options.type) el.type = options.type
    if ('name' in el && options.name) el.name = options.name
    if (options.className) el.className = options.className
    return el
}

/**
 * 
 * @param {Element} el 
 */
function* yeildParents(el) {
    do {
        yield el
    } while (el = el.parentElement)
}

//TODO: MODULES SHOULD NOT WORK WITHOUT API

//TODO: PASSIVE EVENTS


