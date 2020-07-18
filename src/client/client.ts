import * as THREE from '/build/three.module.js'
import Stats from '/jsm/libs/stats.module'
import TheBallGame from './theBallGame.js'

const socket: SocketIOClient.Socket = io()

const scene: THREE.Scene = new THREE.Scene()

const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const theBallGame: TheBallGame = new TheBallGame(socket, scene, renderer)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    theBallGame.camera.aspect = window.innerWidth / window.innerHeight
    theBallGame.camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

const stats = Stats()
document.body.appendChild(stats.dom)

const animate = function () {

    theBallGame.update()   
    
    renderer.render(scene, theBallGame.camera)

    stats.update()

    requestAnimationFrame(animate)

};

animate();
