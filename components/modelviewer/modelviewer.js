import * as THREE from "three";
import { OBJLoader } from "three/addons";

class TimeLock {
    locked = false
    /** @type {number} */
    #timer

    lock() {
        if (!this.locked) this.locked = true
        window.clearTimeout(this.#timer)
        this.#timer = window.setTimeout(() => this.locked = false, 200)
    }
}

const credentials = JSON.parse(window.modelviewerApi.credentials)

window.modelviewerApi.receiver((m) => {
    window.modelviewerApi.stdout(m)
})

/** @param {ErrorEvent} something  */
function err(something) {
    window.modelviewerApi.stdout(something.message)
    window.close()
}

window.addEventListener('error', err)

window.modelviewerApi.stdout(window.modelviewerApi.credentials)

const scene = new THREE.Scene()

scene.background = new THREE.Color(0x00ff00)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.4, 10)

const renderer = new THREE.WebGLRenderer()

renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
renderer.setPixelRatio(window.devicePixelRatio)

const resizeLock = new TimeLock()

window.addEventListener('resize', () => {
    resizeLock.lock()
    
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
})

const loader = new OBJLoader()
const mtlload = new THREE.TextureLoader()

camera.position.z = 3;

const light = new THREE.AmbientLight(0xffffff);
scene.add(light);

let xrot = isNaN(parseInt(credentials['xrot'])) ? 0.01 : (parseInt(credentials['xrot']) / 100)
let yrot = isNaN(parseInt(credentials['yrot'])) ? 0.01 : (parseInt(credentials['yrot']) / 100)

window.modelviewerApi.stdout('loading...')

const { texture, model } = await loadResources(
    credentials['texture'], 
    credentials['model']
).catch((err) => crash(err))

let isOBJ = false
model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
        child.material.map = texture
        isOBJ = true
    }
})

if (!isOBJ) crash(new ReferenceError('Loaded file is not an OBJ'))

scene.add(model);

let delta = 0;
const interval = 1 / credentials['fps']
const clock = new THREE.Clock();
clock.start()

window.modelviewerApi.stdout(xrot, yrot)

function animate() {
    requestAnimationFrame(animate);
    if (resizeLock.locked) return;
    model.rotation.x += xrot
    model.rotation.y += yrot

    if (interval === Infinity) {
        renderer.render(scene, camera);
        return
    }

    delta += clock.getDelta();

    if (delta > interval) {
        renderer.render(scene, camera);
        delta = delta % interval;
    }
}

window.modelviewerApi.stdout('displaying scene')
window.modelviewerApi.ready()
animate()

/**
 * @param {Error} reason
 * @returns {never}
 */
function crash(reason) {
    window.removeEventListener('error', err)
    window.modelviewerApi.stdout(reason.stack? reason.stack : `${reason.name} ${reason.message}`)
    window.close()
    throw undefined
}

/**
 * @param {string} texturePath
 * @param {string} modelPath
 */
async function loadResources(texturePath, modelPath) {
    const [texture, model] = await Promise.allSettled([
        mtlload.loadAsync(texturePath),
        loader.loadAsync(modelPath)
    ])
    if (texture.status !== 'fulfilled') throw new ReferenceError(`could not load texture`)
    if (model.status !== 'fulfilled') throw new ReferenceError(`could not load model`)
    
    return {texture: texture.value, model: model.value}
}


