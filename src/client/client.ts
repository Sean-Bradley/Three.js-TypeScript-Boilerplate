import * as THREE from 'three'
import StatsVR from './utils/statsvr'
import { VRButton } from 'three/examples/jsm/webxr/VRButton'
import TeleportVR from 'teleportvr'
import GrabVR from 'grabvr'
import Explosion from './explosion'
import * as CANNON from 'cannon-es'
//import CannonDebugRenderer from './utils/cannonDebugRenderer'

let bulletCounter = 0
const maxBullets = 10
//const collidableMeshList: THREE.Mesh[] = []
const elevationsMeshList: THREE.Mesh[] = []

const world = new CANNON.World()
world.gravity.set(0, -9.82, 0)
//world.broadphase = new CANNON.NaiveBroadphase()
//world.solver.iterations = 10
//world.allowSleep = true

const scene = new THREE.Scene()

const explosions = [
    new Explosion(new THREE.Color(0xff0000), scene),
    new Explosion(new THREE.Color(0x00ff00), scene),
    new Explosion(new THREE.Color(0x0000ff), scene),
]
let explosionCounter = 0

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 1.6, 3)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.xr.enabled = true

document.body.appendChild(renderer.domElement)

document.body.appendChild(VRButton.createButton(renderer))

const meshes: THREE.Mesh[] = []
const bodies: CANNON.Body[] = []

const bullets: THREE.Mesh[] = []
const bulletBodies: CANNON.Body[] = []

const teleportVR = new TeleportVR(scene, camera)
const grabVR = new GrabVR()
grabVR.addEventListener('grabStart', (id: number) => {
    console.log('grabStart ' + id)
    teleportVR.enabled[id] = false
})
grabVR.addEventListener('grabEnd', (id: number) => {
    console.log('grabEnd ' + id)
    teleportVR.enabled[id] = true
})

//floor
const planeGeometry = new THREE.PlaneGeometry(25, 25, 10, 10)
const floor = new THREE.Mesh(
    planeGeometry,
    new THREE.MeshBasicMaterial({
        color: 0x008800,
        wireframe: true,
    })
)
floor.rotateX(-Math.PI / 2)
scene.add(floor)
//collidableMeshList.push(floor);
elevationsMeshList.push(floor)
const planeShape = new CANNON.Plane()
const planeBody = new CANNON.Body({ mass: 0 })
planeBody.addShape(planeShape)
planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
world.addBody(planeBody)

//  cubes
for (var i = 0; i < 20; i++) {
    const size = { x: Math.random() * 4 + 1, y: Math.random() * 4 + 1, z: Math.random() * 4 + 1 }
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y, size.z),
        new THREE.MeshBasicMaterial({
            color: 0xff0066,
            wireframe: true,
        })
    )
    mesh.position.x = Math.random() * 20 - 10
    mesh.position.y = Math.random() * 20 + 5
    mesh.position.z = Math.random() * 20 - 10
    mesh.userData.isGrabbed = false

    grabVR.grabableObjects().push(mesh)

    scene.add(mesh)

    const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2))
    const body = new CANNON.Body({ mass: 1 })
    body.addShape(shape)
    body.position.x = mesh.position.x
    body.position.y = mesh.position.y
    body.position.z = mesh.position.z
    world.addBody(body)

    meshes.push(mesh)
    bodies.push(body)
    //collidableMeshList.push(mesh);
    elevationsMeshList.push(mesh)
}

//pre create bullets
for (let i = 0; i < maxBullets; i++) {
    const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 1, 5),
        new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true,
        })
    )
    mesh.rotation.z = Math.PI / -2
    mesh.userData.lifeTime = 0
    //mesh.position.y = -10
    bullets.push(mesh)
    //collidableMeshList.push(mesh)
    mesh.visible = false
    scene.add(mesh)

    const shape = new CANNON.Cylinder(0.025, 0.025, 1, 5)
    const body = new CANNON.Body({ mass: 1 })
    const quaternion = new CANNON.Quaternion()
    quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    body.addShape(shape, new CANNON.Vec3(), quaternion)
    body.position.x = mesh.position.x
    body.position.y = mesh.position.y
    body.position.z = mesh.position.z
    body.sleep()
    world.addBody(body)

    //meshes.push(mesh)
    bulletBodies.push(body)
}

window.addEventListener('resize', onWindowResize, false)

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

const lefthand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16, 1, true),
    new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        wireframe: true,
    })
)

const controllerGrip0 = renderer.xr.getControllerGrip(0)
controllerGrip0.addEventListener('connected', (e: any) => {
    controllerGrip0.add(lefthand)
    grabVR.add(0, controllerGrip0, e.data.gamepad)
    teleportVR.add(0, controllerGrip0, e.data.gamepad)
})

const righthand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16, 1, true),
    new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        wireframe: true,
    })
)
const controllerGrip1 = renderer.xr.getControllerGrip(1)
controllerGrip1.addEventListener('connected', (e: any) => {
    controllerGrip1.add(righthand)
    grabVR.add(1, controllerGrip1, e.data.gamepad)
    teleportVR.add(1, controllerGrip1, e.data.gamepad)
})

controllerGrip0.addEventListener('selectstart', () => {
    if (
        teleportVR.gamePads[0].hapticActuators &&
        teleportVR.gamePads[0].hapticActuators.length > 0
    ) {
        (teleportVR.gamePads[1].hapticActuators[1] as any).pulse(1.0, 5)
    }
    bullets[bulletCounter].visible = false
    controllerGrip0.getWorldPosition(bullets[bulletCounter].position)
    controllerGrip0.getWorldQuaternion(bullets[bulletCounter].quaternion)

    bulletBodies[bulletCounter].position.x = bullets[bulletCounter].position.x
    bulletBodies[bulletCounter].position.y = bullets[bulletCounter].position.y
    bulletBodies[bulletCounter].position.z = bullets[bulletCounter].position.z
    bulletBodies[bulletCounter].quaternion.x = bullets[bulletCounter].quaternion.x
    bulletBodies[bulletCounter].quaternion.y = bullets[bulletCounter].quaternion.y
    bulletBodies[bulletCounter].quaternion.z = bullets[bulletCounter].quaternion.z
    bulletBodies[bulletCounter].quaternion.w = bullets[bulletCounter].quaternion.w
    const v = new THREE.Vector3(0, -1, 0)
    v.applyEuler(new THREE.Euler().setFromQuaternion(bullets[bulletCounter].quaternion, 'XYZ'))
    v.multiplyScalar(50)
    bulletBodies[bulletCounter].velocity.set(v.x, v.y, v.z)
    bulletBodies[bulletCounter].angularVelocity.set(0, 0, 0)
    bulletBodies[bulletCounter].wakeUp()

    bullets[bulletCounter].userData.lifeTime = 0
    bullets[bulletCounter].visible = true
    bulletCounter += 1
    if (bulletCounter >= maxBullets) {
        bulletCounter = 0
    }

    controllerGrip0.children[0].translateY(0.15)
    setTimeout(() => {
        controllerGrip0.children[0].translateY(-0.15)
    }, 100)
})

controllerGrip1.addEventListener('selectstart', () => {
    if (
        teleportVR.gamePads[1].hapticActuators &&
        teleportVR.gamePads[1].hapticActuators.length > 0
    ) {
        (teleportVR.gamePads[1].hapticActuators[1] as any).pulse(1.0, 5)
    }
    bullets[bulletCounter].visible = false
    controllerGrip1.getWorldPosition(bullets[bulletCounter].position)
    controllerGrip1.getWorldQuaternion(bullets[bulletCounter].quaternion)

    bulletBodies[bulletCounter].position.x = bullets[bulletCounter].position.x
    bulletBodies[bulletCounter].position.y = bullets[bulletCounter].position.y
    bulletBodies[bulletCounter].position.z = bullets[bulletCounter].position.z
    bulletBodies[bulletCounter].quaternion.x = bullets[bulletCounter].quaternion.x
    bulletBodies[bulletCounter].quaternion.y = bullets[bulletCounter].quaternion.y
    bulletBodies[bulletCounter].quaternion.z = bullets[bulletCounter].quaternion.z
    bulletBodies[bulletCounter].quaternion.w = bullets[bulletCounter].quaternion.w
    const v = new THREE.Vector3(0, -1, 0)
    v.applyEuler(new THREE.Euler().setFromQuaternion(bullets[bulletCounter].quaternion, 'XYZ'))
    v.multiplyScalar(50)
    bulletBodies[bulletCounter].velocity.set(v.x, v.y, v.z)
    bulletBodies[bulletCounter].angularVelocity.set(0, 0, 0)
    bulletBodies[bulletCounter].wakeUp()

    bulletBodies[bulletCounter].addEventListener('collide', addExplosion)

    bullets[bulletCounter].userData.lifeTime = 0
    bullets[bulletCounter].visible = true
    bulletCounter += 1
    if (bulletCounter >= maxBullets) {
        bulletCounter = 0
    }

    controllerGrip1.children[0].translateY(0.15)
    setTimeout(() => {
        controllerGrip1.children[0].translateY(-0.15)
    }, 100)
})

function addExplosion(e: any) {
    explosions[explosionCounter].explode(e.contact.bj.position)
    explosionCounter++
    if (explosionCounter >= explosions.length) {
        explosionCounter = 0
    }
    e.target.removeEventListener('collide', addExplosion)
}

//custom TeleportVR target object
var uniforms = {
    time: { type: 'f', value: 1.0 },
    tExplosion: {
        type: 't',
        value: new THREE.TextureLoader().load('img/blackBluePurple.png'),
    },
}
var targetMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: (document.getElementById('vertexShader') as HTMLElement)
            .textContent as string,
        fragmentShader: (document.getElementById('fragmentShader') as HTMLElement)
            .textContent as string,
        transparent: true,
    })
)
targetMesh.geometry.scale(1, 0.2, 1)
teleportVR.target.add(targetMesh)
teleportVR.useDefaultTargetHelper(false)

//custom TeleportVR Direction object
var targetDirectionIndicatorL = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.01, 0.5),
    new THREE.MeshBasicMaterial({
        color: 0x0000ff,
        wireframe: true,
    })
)
targetDirectionIndicatorL.translateZ(-1.5)
targetDirectionIndicatorL.translateX(-0.11)
targetDirectionIndicatorL.rotateY(Math.PI / -4)
teleportVR.target.add(targetDirectionIndicatorL)

var targetDirectionIndicatorR = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.01, 0.5),
    new THREE.MeshBasicMaterial({
        color: 0x0000ff,
        wireframe: true,
    })
)
targetDirectionIndicatorR.translateZ(-1.5)
targetDirectionIndicatorR.translateX(0.11)
targetDirectionIndicatorR.rotateY(Math.PI / 4)
teleportVR.target.add(targetDirectionIndicatorR)

teleportVR.useDefaultDirectionHelper(false)

//custom TeleportVR Curve material
const curveMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: (document.getElementById('vertexShader') as HTMLElement).textContent as string,
    fragmentShader: (document.getElementById('fragmentShader') as HTMLElement)
        .textContent as string,
    transparent: true,
})
teleportVR.curve.material = curveMaterial

const statsVR = new StatsVR(scene, camera)
statsVR.setX(0)
statsVR.setY(0)
statsVR.setZ(-2)

const clock = new THREE.Clock()
let delta: number

//const cannonDebugRenderer = new CannonDebugRenderer(scene, world)

function render() {
    statsVR.update()

    teleportVR.update(elevationsMeshList)

    grabVR.update(delta)

    delta = clock.getDelta()
    if (delta > 0.01) delta = 0.01
    world.step(delta)
    //cannonDebugRenderer.update()

    uniforms.time.value += delta

    meshes.forEach((m, i) => {
        if (!m.userData.isGrabbed) {
            m.position.set(bodies[i].position.x, bodies[i].position.y, bodies[i].position.z)
            m.quaternion.set(
                bodies[i].quaternion.x,
                bodies[i].quaternion.y,
                bodies[i].quaternion.z,
                bodies[i].quaternion.w
            )
        } else {
            bodies[i].position.x = m.position.x
            bodies[i].position.y = m.position.y
            bodies[i].position.z = m.position.z
            bodies[i].quaternion.x = m.quaternion.x
            bodies[i].quaternion.y = m.quaternion.y
            bodies[i].quaternion.z = m.quaternion.z
            bodies[i].quaternion.w = m.quaternion.w
            bodies[i].velocity.set(0, 0, 0)
            bodies[i].angularVelocity.set(0, 0, 0)
        }
    })

    bullets.forEach((b, i) => {
        if (b.visible) {
            b.userData.lifeTime += delta
            if (b.userData.lifeTime < 15) {
                b.position.set(
                    bulletBodies[i].position.x,
                    bulletBodies[i].position.y,
                    bulletBodies[i].position.z
                )
                b.quaternion.set(
                    bulletBodies[i].quaternion.x,
                    bulletBodies[i].quaternion.y,
                    bulletBodies[i].quaternion.z,
                    bulletBodies[i].quaternion.w
                )
            } else {
                b.visible = false
                bulletBodies[i].sleep()
            }
        }
    })

    for (let i = 0; i < explosions.length; i++) {
        explosions[i].update()
    }

    renderer.render(scene, camera)
}

renderer.setAnimationLoop(render)
