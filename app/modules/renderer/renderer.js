import * as THREE from "three";
import { OBJLoader } from "three/addons";

window.rendererApi.toClose(() => {
    window.close()
})

window.addEventListener('error', (ev) => {
    window.rendererApi.stdout(ev.message)
    window.close()
})

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

let xrot = 0.005
let yrot = 0.005

window.rendererApi.onData((args) => {
    xrot = parseFloat(args)
})

window.rendererApi.stdout('loading the model')
mtlload.load('../../../content/rat_albedo.png', (texture) => {
    window.rendererApi.stdout('texture loaded')
    loader.load('../../../content/eeee.obj', (obj) => {
        window.rendererApi.stdout('model loaded')
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
        window.rendererApi.stdout('displaying scene')
        window.rendererApi.ready()
        animate()
    }, undefined, (err) => {
        window.rendererApi.stdout(`an error has occured ${err}`)
        window.close()
    })
}, undefined, (err) => {
    window.rendererApi.stdout(`an error has occured ${err}`)
    window.close()
})
