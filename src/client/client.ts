import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import Stats from 'three/examples/jsm/libs/stats.module'
import JEASINGS from 'jeasings'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'

let annotations: { [key: string]: Annotation }
const annotationMarkers: THREE.Sprite[] = []

const scene = new THREE.Scene()

var light = new THREE.DirectionalLight()
light.position.set(-30, 30, 30)
scene.add(light)

var light2 = new THREE.DirectionalLight()
light2.position.set(30, 30, -30)
scene.add(light2)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.x = 10
camera.position.y = 5
camera.position.z = 8

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const labelRenderer = new CSS2DRenderer()
labelRenderer.setSize(window.innerWidth, window.innerHeight)
labelRenderer.domElement.style.position = 'absolute'
labelRenderer.domElement.style.top = '0px'
labelRenderer.domElement.style.pointerEvents = 'none'
document.body.appendChild(labelRenderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.dampingFactor = 0.2
controls.enableDamping = true
controls.target.set(8, 3, 4)

const raycaster = new THREE.Raycaster()
const sceneMeshes = new Array()

const circleTexture = new THREE.TextureLoader().load('img/circle.png')

const progressBar = document.getElementById('progressBar') as HTMLProgressElement

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('./js/libs/draco/')

const loader = new GLTFLoader()
loader.setDRACOLoader(dracoLoader)
loader.load(
    './models/house-water-transformed.glb',
    (gltf) => {
        gltf.scene.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) {
                const mesh = c as THREE.Mesh
                const material = mesh.material as THREE.MeshStandardMaterial
                if (!['sink_faiance', 'white_409', 'Ceramic'].includes(material.name)) {
                    material.flatShading = true
                }
                if (
                    [
                        'ground_1',
                        'wall_1_2',
                        'room_58_344',
                        'grey',
                        'flltgrey',
                        'flltgrey_sweethome3d_window_pane_420',
                        'default',
                        'Glass',
                        'Glass_458',
                        'flltgrey_sweethome3d_window_pane_479',
                        'white_Fenetre_480',
                        'white_13_526',
                        'flltgrey_14_527',
                        'wall_1_4',
                        'glassblutint',
                        'Aluminium_652',
                        'Default_Texture',
                        'GLASS',
                        'Glass_sweethome3d_window_mirror_985',
                        'cylinder_cylinder_1302',
                    ].includes(material.name)
                ) {
                    material.transparent = true
                    material.opacity = 0.2
                    material.depthWrite = false
                }
            }
        })
        scene.add(gltf.scene)
        sceneMeshes.push(gltf.scene)

        const annotationsDownload = new XMLHttpRequest()
        annotationsDownload.open('GET', '/data/annotations.json')
        annotationsDownload.onreadystatechange = function () {
            if (annotationsDownload.readyState === 4) {
                annotations = JSON.parse(annotationsDownload.responseText)

                const annotationsPanel = document.getElementById(
                    'annotationsPanel'
                ) as HTMLDivElement
                const ul = document.createElement('ul') as HTMLUListElement
                const ulElem = annotationsPanel.appendChild(ul)
                Object.keys(annotations).forEach((a) => {
                    const li = document.createElement('li') as HTMLLIElement
                    const liElem = ulElem.appendChild(li)
                    const button = document.createElement('button') as HTMLButtonElement
                    button.innerHTML = a + ' : ' + annotations[a].title
                    button.className = 'annotationButton'
                    button.addEventListener('click', function () {
                        gotoAnnotation(annotations[a])
                    })
                    liElem.appendChild(button)

                    const annotationSpriteMaterial = new THREE.SpriteMaterial({
                        map: circleTexture,
                        depthTest: false,
                        depthWrite: false,
                        sizeAttenuation: false,
                    })
                    const annotationSprite = new THREE.Sprite(annotationSpriteMaterial)
                    annotationSprite.scale.set(0.066, 0.066, 0.066)
                    annotationSprite.position.copy(annotations[a].lookAt)
                    annotationSprite.userData.id = a
                    annotationSprite.renderOrder = 1
                    scene.add(annotationSprite)
                    annotationMarkers.push(annotationSprite)

                    const annotationDiv = document.createElement('div')
                    annotationDiv.className = 'annotationLabel'
                    annotationDiv.innerHTML = a
                    const annotationLabel = new CSS2DObject(annotationDiv)
                    annotationLabel.position.copy(annotations[a].lookAt)
                    scene.add(annotationLabel)

                    if (annotations[a].description) {
                        const annotationDescriptionDiv = document.createElement('div')
                        annotationDescriptionDiv.className = 'annotationDescription'
                        annotationDescriptionDiv.innerHTML = annotations[a].description
                        annotationDiv.appendChild(annotationDescriptionDiv)
                        annotations[a].descriptionDomElement = annotationDescriptionDiv
                    }
                })
                progressBar.style.display = 'none'
            }
        }
        annotationsDownload.send()
    },
    (xhr) => {
        if (xhr.lengthComputable) {
            let percentComplete = (xhr.loaded / xhr.total) * 100
            progressBar.value = percentComplete
            progressBar.style.display = 'block'
        }
    }
)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    labelRenderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

const v = new THREE.Vector2()

function onClick(event: MouseEvent) {
    v.set(
        (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    )
    raycaster.setFromCamera(v, camera)

    const intersects = raycaster.intersectObjects(annotationMarkers, true)
    if (intersects.length > 0) {
        if (intersects[0].object.userData && intersects[0].object.userData.id) {
            gotoAnnotation(annotations[intersects[0].object.userData.id])
        }
    }
}

renderer.domElement.addEventListener('click', onClick, false)

function onDoubleClick(event: MouseEvent) {
    v.set(
        (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    )
    raycaster.setFromCamera(v, camera)

    const intersects = raycaster.intersectObjects(sceneMeshes, true)

    if (intersects.length > 0) {
        const p = intersects[0].point

        new JEASINGS.JEasing(controls.target)
            .to(
                {
                    x: p.x,
                    y: p.y,
                    z: p.z,
                },
                500
            )
            .easing(JEASINGS.Cubic.Out)
            .start()
    }
}
renderer.domElement.addEventListener('dblclick', onDoubleClick, false)

function gotoAnnotation(a: any): void {
    new JEASINGS.JEasing(camera.position)
        .to(
            {
                x: a.camPos.x,
                y: a.camPos.y,
                z: a.camPos.z,
            },
            500
        )
        .easing(JEASINGS.Cubic.Out)
        .start()

    new JEASINGS.JEasing(controls.target)
        .to(
            {
                x: a.lookAt.x,
                y: a.lookAt.y,
                z: a.lookAt.z,
            },
            500
        )
        .easing(JEASINGS.Cubic.Out)
        .start()

    Object.keys(annotations).forEach((annotation) => {
        if (annotations[annotation].descriptionDomElement) {
            ;(annotations[annotation].descriptionDomElement as HTMLElement).style.display = 'none'
        }
    })
    if (a.descriptionDomElement) {
        a.descriptionDomElement.style.display = 'block'
    }
}

const stats = new Stats()
document.body.appendChild(stats.dom)

function animate() {
    requestAnimationFrame(animate)

    controls.update()

    JEASINGS.update()

    render()

    stats.update()
}

function render() {
    renderer.render(scene, camera)
    labelRenderer.render(scene, camera)
}

animate()
