import * as THREE from '/build/three.module.js';
import Stats from '/jsm/libs/stats.module';
import TheBallGame from './theBallGame.js';
const socket = io();
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const theBallGame = new TheBallGame(socket, scene, renderer);
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    theBallGame.camera.aspect = window.innerWidth / window.innerHeight;
    theBallGame.camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
const stats = Stats();
document.body.appendChild(stats.dom);
const animate = function () {
    theBallGame.update();
    renderer.render(scene, theBallGame.camera);
    stats.update();
    requestAnimationFrame(animate);
};
animate();
