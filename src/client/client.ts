import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { GUI } from 'dat.gui'
import { io } from 'socket.io-client'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

const geometry = new THREE.BoxGeometry()
const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
})

const myObject3D = new THREE.Object3D()
myObject3D.position.x = Math.random() * 4 - 2
myObject3D.position.z = Math.random() * 4 - 2

const gridHelper = new THREE.GridHelper(10, 10)
gridHelper.position.y = -0.5
scene.add(gridHelper)

camera.position.z = 4

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

let myId = ''
let timestamp = 0
const clientCubes: { [id: string]: THREE.Mesh } = {}
const positions: { [id: string]: THREE.Vector3 } = {}
const quaternions: { [id: string]: THREE.Quaternion } = {}
const socket = io()
socket.on('connect', function () {
    console.log('connect')
})

socket.on('disconnect', function (message: any) {
    console.log('disconnect ' + message)
})

socket.on('id', (id: any) => {
    myId = id
    setInterval(() => {
        socket.emit('update', {
            t: Date.now(),
            p: myObject3D.position,
            q: myObject3D.quaternion,
        })
    }, 50)
})

socket.on('clients', (clients: any) => {
    let pingStatsHtml = 'Socket Ping Stats<br/><br/>'

    Object.keys(clients).forEach((c) => {
        timestamp = Date.now()
        pingStatsHtml += c + ' ' + (timestamp - clients[c].t) + 'ms<br/>'

        if (!clientCubes[c]) {
            clientCubes[c] = new THREE.Mesh(geometry, material)
            clientCubes[c].name = c
            scene.add(clientCubes[c])
        } else {
            clients[c].p && (positions[c] = clients[c].p)
            clients[c].q && (quaternions[c] = new THREE.Quaternion(...clients[c].q))
        }
    })
    ;(document.getElementById('pingStats') as HTMLDivElement).innerHTML = pingStatsHtml
})

socket.on('removeClient', (id: string) => {
    scene.remove(scene.getObjectByName(id) as THREE.Object3D)
})

const stats = new Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()
const cubeFolder = gui.addFolder('Cube')
const cubePositionFolder = cubeFolder.addFolder('Position')
cubePositionFolder.add(myObject3D.position, 'x', -5, 5)
cubePositionFolder.add(myObject3D.position, 'z', -5, 5)
cubePositionFolder.open()
const cubeRotationFolder = cubeFolder.addFolder('Rotation')
cubeRotationFolder.add(myObject3D.rotation, 'x', 0, Math.PI * 2, 0.01)
cubeRotationFolder.add(myObject3D.rotation, 'y', 0, Math.PI * 2, 0.01)
cubeRotationFolder.add(myObject3D.rotation, 'z', 0, Math.PI * 2, 0.01)
cubeRotationFolder.open()
cubeFolder.open()

const animate = function () {
    requestAnimationFrame(animate)

    controls.update()

    Object.keys(clientCubes).forEach((c, i) => {
        positions[c] && clientCubes[c].position.lerp(positions[c], 0.1)
        quaternions[c] && clientCubes[c].quaternion.slerp(quaternions[c], 0.1)
    })

    render()

    stats.update()
}

const render = function () {
    renderer.render(scene, camera)
}

animate()
