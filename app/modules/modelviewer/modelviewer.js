import * as THREE from "three";
import { OBJLoader } from "three/addons";

const credentials = JSON.parse(window.modelviewerApi.credentials)

window.modelviewerApi.toClose(() => {
    window.close()
})

window.modelviewerApi.receiver((m) => {
    window.modelviewerApi.stdout(m)
})

window.addEventListener('error', (ev) => {
    window.modelviewerApi.stdout(ev.message)
    window.close()
})

window.modelviewerApi.stdout(window.modelviewerApi.credentials)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x00ff00)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer()
document.body.appendChild(renderer.domElement)
renderer.setSize(window.innerWidth, window.innerHeight)

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
})

const loader = new OBJLoader()
const mtlload = new THREE.TextureLoader()

const clock = new THREE.Clock();
let delta = 0;
// 30 fps
const interval = 1 / 30;

camera.position.z = 3;

const light = new THREE.AmbientLight( 0xffffff );
scene.add( light );

let xrot = credentials['xrot'] / credentials['mul']
let yrot = credentials['yrot'] / credentials['mul']


window.modelviewerApi.stdout('loading the model')
mtlload.load(credentials['texture'], (texture) => {
    window.modelviewerApi.stdout('texture loaded')
    loader.load(credentials['model'], (obj) => {
        window.modelviewerApi.stdout('model loaded')
        obj.traverse((child) => {
            if (child instanceof THREE.Mesh) child.material.map = texture
        })
        scene.add( obj );
        function animate() {
            requestAnimationFrame( animate );
            obj.rotation.x += xrot
            obj.rotation.y += yrot
            delta += clock.getDelta();

            if (delta  > interval) {
                renderer.render( scene, camera );

                delta = delta % interval;
            }
        }
        window.modelviewerApi.stdout('displaying scene')
        window.modelviewerApi.ready()
        animate()
    }, undefined, (err) => {
        window.modelviewerApi.stdout(`an error has occured during model load`)
        window.close()
    })
}, undefined, (err) => {
    window.modelviewerApi.stdout(`an error has occured during texture load`)
    window.close()
})
