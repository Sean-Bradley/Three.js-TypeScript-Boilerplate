/// <reference types="webrtc" />
import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls'
import Stats from '/jsm/libs/stats.module'
import { GUI } from '/jsm/libs/dat.gui.module'

const scene: THREE.Scene = new THREE.Scene()

const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

camera.position.z = 1.5

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}


navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia

window.URL = window.URL || window.webkitURL

const webcam = <HTMLMediaElement>document.getElementById('webcam');

if (navigator.getUserMedia) {
    navigator.getUserMedia({
        video: true
    }, gotStream, noStream);
} else {
    alert('Sorry. <code>navigator.getUserMedia()</code> is not available.');
}

function gotStream(stream) {
    webcam.srcObject = stream;

    webcam.onerror = function (e) {
        stream.stop();
    };

    stream.onended = noStream;
}

function noStream(e) {
    var msg = 'No camera available.';
    if (e.code == 1) {
        msg = 'User denied access to use camera.';
    }
    alert(msg);
}

const webcamCanvas = <HTMLCanvasElement>document.getElementById('webcamCanvas');
const canvasCtx = webcamCanvas.getContext('2d');
canvasCtx.fillStyle = '#000000';
canvasCtx.fillRect(0, 0, webcamCanvas.width, webcamCanvas.height);
const webcamTexture = new THREE.Texture(webcamCanvas);
webcamTexture.minFilter = THREE.LinearFilter;
webcamTexture.magFilter = THREE.LinearFilter;

const geometry: THREE.BoxGeometry = new THREE.BoxGeometry()
const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ map: webcamTexture, side: THREE.FrontSide })

const cube: THREE.Mesh = new THREE.Mesh(geometry, material)
cube.rotation.x += .5
cube.rotation.y += .5
scene.add(cube)

const stats = Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()


var animate = function () {
    requestAnimationFrame(animate)

    if (webcam.readyState === webcam.HAVE_ENOUGH_DATA) {
        canvasCtx.drawImage(webcam as CanvasImageSource, 0, 0, webcamCanvas.width, webcamCanvas.height);
        if (webcamTexture)
            webcamTexture.needsUpdate = true;
    }

    controls.update()

    render()

    stats.update()
};

function render() {
    renderer.render(scene, camera)
}
animate();