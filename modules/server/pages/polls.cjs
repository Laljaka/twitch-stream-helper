const elem = document.querySelector('div')

setInterval(async () => {
    try {
        const resp = await fetch(`/polls`, { method: 'POST' , headers: {"Content-Type": "application/json"}})
        const decoded = await resp.json()
        elem.innerText = JSON.stringify(decoded)
    } catch (error) {
        console.log(error)
    }

    
}, 5000)