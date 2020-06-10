import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls'
import Stats from '/jsm/libs/stats.module'
import { GUI } from '/jsm/libs/dat.gui.module'
import { TWEEN, Tween } from '/jsm/libs/tween.module.min'

const scene: THREE.Scene = new THREE.Scene()

const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

const geometry: THREE.BoxGeometry = new THREE.BoxGeometry()
const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })

const cube: THREE.Mesh = new THREE.Mesh(geometry, material)
scene.add(cube)

camera.position.z = 4

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

const stats = Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()
const cubeFolder = gui.addFolder("Cube")
const cubePositionFolder = cubeFolder.addFolder("Position")
cubePositionFolder.add(cube.position, "x", -5, 5)
cubePositionFolder.add(cube.position, "z", -5, 5)
cubePositionFolder.open()
const cubeRotationFolder = cubeFolder.addFolder("Rotation")
cubeRotationFolder.add(cube.rotation, "x", 0, Math.PI * 2, 0.01)
cubeRotationFolder.add(cube.rotation, "y", 0, Math.PI * 2, 0.01)
cubeRotationFolder.add(cube.rotation, "z", 0, Math.PI * 2, 0.01)
cubeRotationFolder.open()
cubeFolder.open()
const cameraFolder = gui.addFolder("Camera")
cameraFolder.add(camera.position, "z", 0, 10, 0.01)
cameraFolder.open()


let myId: string = ""
const peerCubes: { [id: string]: THREE.Mesh } = {}
const tweens: { [id: string]: Tween } = {}
const socket: SocketIOClient.Socket = io()
socket.on("connect", function () {
    console.log("connect")
})
socket.on("disconnect", function (message: any) {
    console.log("disconnect " + message)
})
socket.on("id", (id: any) => {
    myId = id
})
socket.on("peers", (peers: any) => {
    Object.keys(peers).forEach((p) => {
        if (p !== myId) {
            //console.log(peers[p])
            if (!peerCubes[p]) {
                //console.log("unknown peer" + p)
                peerCubes[p] = new THREE.Mesh(geometry, material)
                peerCubes[p].name = p
                scene.add(peerCubes[p])
            } else {
                //console.log(peers[p].r)

                // tweens[p] = new TWEEN.Tween(peerCubes[p].quaternion)
                //     .to({
                //         x: peers[p].q._x,
                //         y: peers[p].q._y,
                //         z: peers[p].q._z,
                //         w: peers[p].q._w
                //     }, 100)
                //     .start()

                tweens[p] = new TWEEN.Tween(peerCubes[p].position)
                    .to({
                        x: peers[p].p.x,
                        y: peers[p].p.y,
                        z: peers[p].p.z
                    }, 100)
                    .start()
                tweens[p] = new TWEEN.Tween(peerCubes[p].rotation)
                    .to({
                        x: peers[p].r._x,
                        y: peers[p].r._y,
                        z: peers[p].r._z
                    }, 100)
                    .start()
            }
        }
    })
})
socket.on("removePeer", (id: string) => {
    scene.remove(scene.getObjectByName(id));
})

setInterval(() => {
    socket.emit("update", { p: cube.position, r: cube.rotation })
}, 100)


const animate = function () {
    requestAnimationFrame(animate)

    controls.update()

    TWEEN.update();

    render()

    stats.update()
};

const render = function () {
    renderer.render(scene, camera)
}
animate();
