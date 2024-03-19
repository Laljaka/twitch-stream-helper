const elem = document.querySelector('div')!

setInterval(() => {
    elem.innerText = window.location.host
    
}, 5000)