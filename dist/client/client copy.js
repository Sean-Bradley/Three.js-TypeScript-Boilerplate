import * as THREE from '/build/three.module.js';
import { OrbitControls } from '/jsm/controls/OrbitControls';
import Stats from '/jsm/libs/stats.module';
const scene = new THREE.Scene();
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);
var light = new THREE.HemisphereLight();
scene.add(light);
var helper = new THREE.HemisphereLightHelper(light, 5);
scene.add(helper);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
// controls.autoRotate = true
// controls.autoRotateSpeed = 10
// controls.enableDamping = true
// controls.dampingFactor = .01
controls.enableKeys = true;
controls.keys = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    BOTTOM: 40 // down arrow
};
controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
};
controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
};
controls.minAzimuthAngle = 0; ///Math.PI / 2
controls.maxAzimuthAngle = Math.PI / 2;
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI - (Math.PI / 4);
controls.maxDistance = 4;
controls.minDistance = 2;
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
camera.position.z = 2;
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}
const stats = Stats();
document.body.appendChild(stats.dom);
var animate = function () {
    requestAnimationFrame(animate);
    helper.update();
    render();
    stats.update();
};
function render() {
    renderer.render(scene, camera);
}
animate();
