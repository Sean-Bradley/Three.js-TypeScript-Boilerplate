import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module'
import TheBallGame from './theBallGame'
import { io } from 'socket.io-client'

const socket = io()

const scene = new THREE.Scene()

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
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

const stats = Stats()
document.body.appendChild(stats.dom)

function animate() {
    requestAnimationFrame(animate)

    theBallGame.update()

    renderer.render(scene, camera)

    stats.update()
}

animate()
