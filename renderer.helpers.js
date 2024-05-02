export class TimeLogger {
    #doodad
    #enabled
    /** @param {boolean} enabled  */
    constructor(enabled) {
        this.#doodad = 'time'
        this.#enabled = enabled
        console.time(this.#doodad)
    }

    /** @param {string} [args]  */
    log(args) {
        if (!this.#enabled) return
        console.timeLog(this.#doodad, args)
    }

    end() {
        if (!this.#enabled) return
        console.timeEnd(this.#doodad)
        this.#enabled = false
    }
}

/**
 * @param {string} forr 
 * @param {Array<string>} allowed 
 * @returns 
 */
export function generateQueryAllowed(forr, allowed) {
    let res = `${forr}:not(`
    for (const dis of allowed) {
        res = res.concat(`${dis}, `)
    }
    res = res.slice(0, -2)
    res = res.concat(')')
    return res
}

/**
 * 
 * @param {Element} el 
 */
export function* yeildParents(el) {
    do {
        yield el
    } while (el = el.parentElement)
}

/**
 * @template {keyof HTMLElementTagNameMap} K 
 * @param {K} type 
 * @param {import("./shared_types.js").ElementOptions} options 
 * @returns {HTMLElementTagNameMap[K]}
 */
export function createElementOneLine(type, options) {
    const el = document.createElement(type)
    if (options.id) el.id = options.id
    if ((el instanceof HTMLInputElement || el instanceof HTMLButtonElement) && options.type) el.type = options.type
    if ('name' in el && options.name) el.name = options.name
    if (options.className) el.className = options.className
    return el
}

/** @param {Element} element  */
export function handleFileInput(element) {
    if (!(element instanceof HTMLInputElement)) return
    const button = createElementOneLine('button', {type: 'button'})
    const hidden = createElementOneLine('input', {type: 'hidden', name: element.name})
    const test = element.dataset['extensions'].split(', ')
    button.innerText = element.placeholder
    hidden.addEventListener('input', async () => {
        button.innerText = hidden.value ? await window.mainApi.getFileName(hidden.value) : element.placeholder
    })
    hidden.addEventListener('fake-input', async () => {
        button.innerText = hidden.value ? await window.mainApi.getFileName(hidden.value) : element.placeholder
    })
    button.addEventListener('click', async (_) => {
        // TODO should not give control top opening any file to renderer process
        const response = await window.mainApi.openFile({ title: "Open", properties: ['openFile'], filters: [{name: test[0], extensions: test}]})
        if (!response.canceled) {
            hidden.value = response.filePaths[0]
            hidden.dispatchEvent(new Event('input', { bubbles: true }))
        }
    })
    element.after(hidden)
    element.after(button)
    element.remove()
}

/** @param {Element} elem  */
export function generatePasswordReveals(elem) {
    if (!(elem instanceof HTMLInputElement)) return
    const hide = createElementOneLine('input', {type: 'checkbox', className: 'reveal'})

    hide.addEventListener('change', (_) => {
        elem.type = hide.checked? 'text' : "password"
    })

    elem.after(hide)
}