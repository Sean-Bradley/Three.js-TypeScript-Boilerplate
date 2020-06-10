import * as THREE from '/build/three.module.js';
import { OrbitControls } from '/jsm/controls/OrbitControls';
import Stats from '/jsm/libs/stats.module';
import { GUI } from '/jsm/libs/dat.gui.module';
import { TWEEN } from '/jsm/libs/tween.module.min';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
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
const gui = new GUI();
const cubeFolder = gui.addFolder("Cube");
cubeFolder.add(cube.rotation, "x", 0, Math.PI * 2, 0.01);
cubeFolder.add(cube.rotation, "y", 0, Math.PI * 2, 0.01);
cubeFolder.add(cube.rotation, "z", 0, Math.PI * 2, 0.01);
cubeFolder.open();
const cameraFolder = gui.addFolder("Camera");
cameraFolder.add(camera.position, "z", 0, 10, 0.01);
cameraFolder.open();
let myId = "";
const peerCubes = {};
const tweens = {};
const socket = io();
socket.on("connect", function () {
    console.log("connect");
});
socket.on("disconnect", function (message) {
    console.log("disconnect " + message);
});
socket.on("id", (id) => {
    myId = id;
});
socket.on("peers", (peers) => {
    Object.keys(peers).forEach((p) => {
        if (p !== myId) {
            //console.log(peers[p])
            if (!peerCubes[p]) {
                console.log("unknown peer" + p);
                peerCubes[p] = new THREE.Mesh(geometry, material);
                peerCubes[p].name = p;
                scene.add(peerCubes[p]);
            }
            else {
                //console.log(peers[p].q)
                //peerCubes[p].position.set(peerCubes[p].p.x, peerCubes[p].p.y, peerCubes[p].p.z)
                //peerCubes[p].quaternion.set(peers[p].q._x, peers[p].q._y, peers[p].q._z, peers[p].q._w)
                tweens[p] = new TWEEN.Tween(peerCubes[p].quaternion)
                    .to({
                    x: peers[p].q._x,
                    y: peers[p].q._y,
                    z: peers[p].q._z,
                    w: peers[p].q._w
                }, 100)
                    .start();
            }
        }
    });
});
socket.on("removePeer", (id) => {
    scene.remove(scene.getObjectByName(id));
});
setInterval(() => {
    socket.emit("update", { p: cube.position, q: cube.quaternion });
}, 100);
const animate = function () {
    requestAnimationFrame(animate);
    controls.update();
    // Object.keys(tweens).forEach((t: TWEEN.Tween) => {
    //     tweens[t].update()
    // })
    TWEEN.update();
    render();
    stats.update();
};
const render = function () {
    renderer.render(scene, camera);
};
animate();
