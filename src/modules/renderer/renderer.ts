import * as THREE from "three";
import { OBJLoader } from "three/addons";

window.rendererApi.toClose(() => window.close())

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x00ff00)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('3D') as HTMLCanvasElement})
renderer.setSize(window.innerWidth, window.innerHeight)

const loader = new OBJLoader()
const mtlload = new THREE.TextureLoader()

let clock = new THREE.Clock();
let delta = 0;
// 30 fps
let interval = 1 / 30;

camera.position.z = 3;

const light = new THREE.AmbientLight( 0xffffff );
scene.add( light );

mtlload.load('../../../content/rat_albedo.png', (texture) => {
    loader.load('../../../content/eeee.obj', (obj) => {
        obj.traverse((child) => {
            if (child instanceof THREE.Mesh) child.material.map = texture
        })
        scene.add( obj );
        function animate() {
            requestAnimationFrame( animate );
            obj.rotation.x += 0.005
            obj.rotation.y += 0.005
            delta += clock.getDelta();

            if (delta  > interval) {
                renderer.render( scene, camera );

                delta = delta % interval;
            }
        }
        animate()
    })
    
})







//})



