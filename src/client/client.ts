//NOTES:
// BufferGeometry does apply to extruded geometry - https://threejs.org/docs/#api/en/geometries/ExtrudeGeometry if we extrude a ring, we should be good https://threejs.org/docs/#api/en/geometries/RingGeometry
// https://github.com/mrdoob/three.js/blob/master/src/core/InstancedBufferGeometry.js also see this for instancing maybe...

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { FlyControls } from 'three/examples/jsm/controls/FlyControls'
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { BufferGeometry } from 'three'

const scene = new THREE.Scene()

//HELPERS
const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const helper = new THREE.CameraHelper(camera)
scene.add(helper)

// SETUP our DEV CAMERA for navigation and setting up of the scene
const orbitCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.z = 8
orbitCamera.position.z = 4

// LOADERS
// CANT GET IT TO WORK. SIMPLE WHERE SHOULD I REFERENCE THIS SHIT ISSUE
// Instantiate a loader
const loader = new GLTFLoader()
// Load a glTF resource
loader.load('assets/web_n_lights.gltf', (gltfScene) => {
    scene.add(gltfScene.scene)
})

// THE PLAYGROUND
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const geometry = new THREE.BoxGeometry()
const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
})

const cube = new THREE.Mesh(geometry, material)
scene.add(cube)

const controls = new OrbitControls(orbitCamera, renderer.domElement)

// ADD TO THIS ARRAY - Also, please make me a keybinding to cycle through objects so we can move them arround and... we need to be able to store the location of things
let objects = [cube, camera]

const transformControls = new TransformControls(orbitCamera, renderer.domElement)
transformControls.enabled = false
transformControls.attach(objects[0])
scene.add(transformControls)

let cameraSwap = [orbitCamera, camera]
let camSelect = cameraSwap[0]
// Controlling our scene
window.addEventListener('keydown', function (event) {
    switch (event.code) {
        case 'KeyX':
            transformControls.enabled = true
            controls.enabled = false
            break
        case 'KeyZ':
            transformControls.enabled = false
            controls.enabled = true
            break
        case 'KeyW':
            transformControls.setMode('translate')
            break
        case 'KeyR':
            transformControls.setMode('rotate')
            break
        case 'KeyS':
            transformControls.setMode('scale')
            break
        case 'KeyC': {
            camSelect = cameraSwap[1]
            break
        }
    }
})
window.addEventListener('keyup', function (event) {
    switch (event.code) {
        case 'KeyC': {
            camSelect = cameraSwap[0]
            break
        }
    }
})

// controls.update(600)
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    orbitCamera.aspect = window.innerWidth / window.innerHeight
    orbitCamera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

function animate() {
    requestAnimationFrame(animate)

    // cube.rotation.x += 0.01
    // cube.rotation.y += 0.01

    render()
}

function render() {
    renderer.render(scene, camSelect)
}
animate()
