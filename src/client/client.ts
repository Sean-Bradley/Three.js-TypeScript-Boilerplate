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

const gridHelper = new THREE.GridHelper(10, 10);
gridHelper.position.y = -1.5
scene.add(gridHelper);

camera.position.z = 5

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

const webcam: HTMLMediaElement = document.createElement("video") as HTMLMediaElement
webcam.autoplay = true

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

const webcamCanvas: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement
webcamCanvas.width = 1024
webcamCanvas.height = 1024

const canvasCtx: CanvasRenderingContext2D = webcamCanvas.getContext('2d');
canvasCtx.fillStyle = '#000000';
canvasCtx.fillRect(0, 0, webcamCanvas.width, webcamCanvas.height);
const webcamTexture: THREE.Texture = new THREE.Texture(webcamCanvas);
webcamTexture.minFilter = THREE.LinearFilter;
webcamTexture.magFilter = THREE.LinearFilter;

const geometry: THREE.BoxGeometry = new THREE.BoxGeometry()
//const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ map: webcamTexture})

function vertexShader() {
    return `
        varying vec2 vUv;
        void main( void ) {     
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
    `
}
function fragmentShader() {
    return `
        uniform vec3 keyColor;
        uniform float similarity;
        uniform float smoothness;
        varying vec2 vUv;
        uniform sampler2D texture;
        void main() {

            vec4 videoColor = texture2D(texture, vUv);
     
            float Y1 = 0.299 * keyColor.r + 0.587 * keyColor.g + 0.114 * keyColor.b;
            float Cr1 = keyColor.r - Y1;
            float Cb1 = keyColor.b - Y1;
            
            float Y2 = 0.299 * videoColor.r + 0.587 * videoColor.g + 0.114 * videoColor.b;
            float Cr2 = videoColor.r - Y2; 
            float Cb2 = videoColor.b - Y2; 
            
            float blend = smoothstep(similarity, similarity + smoothness, distance(vec2(Cr2, Cb2), vec2(Cr1, Cb1)));
            gl_FragColor = vec4(videoColor.rgb, videoColor.a * blend); 
        }
    `
}

const material = new THREE.ShaderMaterial(
    {
        transparent: true,
        uniforms: {
            texture: { value: webcamTexture },
            keyColor: { value: [0.0, 1.0, 0.0] },
            similarity: { value: 0.8 },
            smoothness: { value: 0.0 }
        },
        vertexShader: vertexShader(),
        fragmentShader: fragmentShader()
    });


const cube: THREE.Mesh = new THREE.Mesh(geometry, material)
cube.add(new THREE.BoxHelper(cube, 0xff0000))

cube.rotateY(.5)
cube.scale.x = 4
cube.scale.y = 3
cube.scale.z = 4
scene.add(cube)

const stats: Stats = Stats()
document.body.appendChild(stats.dom)

var data = {
    keyColor: [0, 255, 0],
    similarity: 0.8,
    smoothness: 0.0
};

const gui = new GUI()
gui.addColor(data, 'keyColor').onChange(() => updateKeyColor(data.keyColor));
gui.add(data, 'similarity', 0.0, 1.0).onChange(() => updateSimilarity(data.similarity));
gui.add(data, 'smoothness', 0.0, 1.0).onChange(() => updateSmoothness(data.smoothness));

function updateKeyColor(v) {
    material.uniforms.keyColor.value = [v[0] / 255, v[1] / 255, v[2] / 255]
}
function updateSimilarity(v) {
    material.uniforms.similarity.value = v
}
function updateSmoothness(v) {
    material.uniforms.smoothness.value = v
}

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