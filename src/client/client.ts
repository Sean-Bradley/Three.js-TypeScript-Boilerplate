import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import TheBallGame from './theBallGame'
import { io } from 'socket.io-client'

const socket = io()

const scene = new THREE.Scene()

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setAnimationLoop(animate)
document.body.appendChild(renderer.domElement)

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)

const theBallGame = new TheBallGame(socket, scene, renderer, camera)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

const stats = new Stats()
document.body.appendChild(stats.dom)

const timer = new THREE.Timer()
timer.connect(document)

function animate() {
    timer.update()

    theBallGame.update(timer.getDelta())

    renderer.render(scene, camera)

    stats.update()
}
