import { ipcRenderer } from "electron"
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/Addons'

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('3D') as HTMLCanvasElement})
renderer.setSize(window.innerWidth, window.innerHeight)

const geom = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geom, material );
scene.add( cube );

camera.position.z = 5;

function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
}

//window.addEventListener('load', () => {
    //document.body.appendChild(renderer.domElement)
animate()
//})


ipcRenderer.on('close', () => {
    window.close()
})
