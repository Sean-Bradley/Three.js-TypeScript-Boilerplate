import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls'
import { OBJLoader } from '/jsm/loaders/OBJLoader'
import { MTLLoader } from '/jsm/loaders/MTLLoader'
import Stats from '/jsm/libs/stats.module'
import { TWEEN } from '/jsm/libs/tween.module.min'
import { CSS2DRenderer, CSS2DObject } from '/jsm/renderers/CSS2DRenderer';

let annotations: { [key: string]: Annotation }
const annotationMarkers: THREE.Mesh[] = []

const scene: THREE.Scene = new THREE.Scene()

var light = new THREE.DirectionalLight();
light.position.set(-30, 30, 30)
scene.add(light);

var light2 = new THREE.DirectionalLight();
light2.position.set(30, 30, -30)
scene.add(light2);


const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.x = 10
camera.position.y = 5
camera.position.z = 8

const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const labelRenderer: CSS2DRenderer = new CSS2DRenderer()
labelRenderer.setSize(window.innerWidth, window.innerHeight)
labelRenderer.domElement.style.position = 'absolute'
labelRenderer.domElement.style.top = '0px'
labelRenderer.domElement.style.pointerEvents = 'none'
document.body.appendChild(labelRenderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.dampingFactor = .2
controls.enableDamping = true
controls.target.set(8, 3, 4)

const raycaster: THREE.Raycaster = new THREE.Raycaster();
const sceneMeshes = new Array()

const mtlLoader = new MTLLoader();
mtlLoader.load('models/house_water.mtl',
    (materials) => {
        materials.preload();

        const progressBar: HTMLProgressElement = document.getElementById('progressBar') as HTMLProgressElement;
        const objLoader: OBJLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load(
            'models/house_water.obj',
            (object) => {
                object.scale.set(.01, .01, .01)
                scene.add(object);
                sceneMeshes.push(object)

                const annotationsDownload = new XMLHttpRequest()
                annotationsDownload.open('GET', '/data/annotations.json')
                annotationsDownload.onreadystatechange = function () {
                    if (annotationsDownload.readyState === 4) {
                        annotations = JSON.parse(annotationsDownload.responseText)

                        const annotationsPanel: HTMLDivElement = document.getElementById("annotationsPanel") as HTMLDivElement
                        const ul: HTMLUListElement = document.createElement("UL") as HTMLUListElement
                        const ulElem = annotationsPanel.appendChild(ul)
                        Object.keys(annotations).forEach((a) => {
                            const li: HTMLLIElement = document.createElement("UL") as HTMLLIElement
                            const liElem = ulElem.appendChild(li)
                            const button: HTMLButtonElement = document.createElement("BUTTON") as HTMLButtonElement
                            button.innerHTML = a + " : " + annotations[a].label;
                            button.className = "annotationButton"
                            button.addEventListener("click", function () { gotoAnnotation(annotations[a]) })
                            liElem.appendChild(button)

                            const circleGeometry = new THREE.CircleGeometry(.02, 12);
                            const circle = new THREE.Mesh(circleGeometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
                            circle.material.transparent = true
                            circle.material.opacity = 1
                            circle.material.depthTest = false
                            circle.material.depthWrite = false
                            circle.position.copy(annotations[a].lookAt)
                            circle.userData.id = a
                            scene.add(circle);
                            annotationMarkers.push(circle)

                            const annotationDiv = document.createElement('div')
                            annotationDiv.className = 'annotationLabel'
                            annotationDiv.textContent = a
                            const annotationLabel = new CSS2DObject(annotationDiv)
                            annotationLabel.position.copy(annotations[a].lookAt)
                            scene.add(annotationLabel)
                        })
                        progressBar.style.display = "none";
                    }
                }
                annotationsDownload.send()
            },
            (xhr) => {
                if (xhr.lengthComputable) {
                    let percentComplete = xhr.loaded / xhr.total * 100;
                    progressBar.value = percentComplete;
                    progressBar.style.display = "block";
                }
            },
            (error) => {
                console.log('An error happened');
            }
        );
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.log('An error happened');
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

renderer.domElement.addEventListener('click', onClick, false);
function onClick(event: MouseEvent) {
    const mouse = {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    }
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(annotationMarkers, true);
    if (intersects.length > 0) {
        gotoAnnotation(annotations[intersects[0].object.userData.id])
    }
}

renderer.domElement.addEventListener('dblclick', onDoubleClick, false);
function onDoubleClick(event: MouseEvent) {
    const mouse = {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    }
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(sceneMeshes, true);

    if (intersects.length > 0) {

        const p = intersects[0].point

        new TWEEN.Tween(controls.target)
            .to({
                x: p.x,
                y: p.y,
                z: p.z
            }, 500)
            .easing(TWEEN.Easing.Cubic.Out)
            .start()
        // .onComplete(() => {
        //     console.log(camera.position)
        //     console.log(controls.target)
        // })
    }
}

function gotoAnnotation(a: any): void {
    new TWEEN.Tween(camera.position)
        .to({
            x: a.camPos.x,
            y: a.camPos.y,
            z: a.camPos.z
        }, 500)
        .easing(TWEEN.Easing.Cubic.Out)
        .start()

    new TWEEN.Tween(controls.target)
        .to({
            x: a.lookAt.x,
            y: a.lookAt.y,
            z: a.lookAt.z
        }, 500)
        .easing(TWEEN.Easing.Cubic.Out)
        .start()
}

const stats = Stats()
document.body.appendChild(stats.dom)

var animate = function () {
    requestAnimationFrame(animate)

    controls.update()

    TWEEN.update();

    annotationMarkers.forEach(a => {
        a.quaternion.copy(camera.quaternion)

        var scaleVector = new THREE.Vector3();
        var scaleFactor = 1;
        var scale = scaleVector.subVectors(a.position, camera.position).length() / scaleFactor;
        a.scale.set(scale, scale, 1);
    })

    render()

    stats.update()
};

function render() {
    labelRenderer.render(scene, camera)
    renderer.render(scene, camera)
}
animate();