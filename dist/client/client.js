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
cube.position.x = (Math.random() * 4) - 2;
cube.position.z = (Math.random() * 4) - 2;
scene.add(cube);
var size = 10;
var divisions = 10;
var gridHelper = new THREE.GridHelper(size, divisions);
gridHelper.position.y = -.5;
scene.add(gridHelper);
camera.position.z = 4;
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
const cubePositionFolder = cubeFolder.addFolder("Position");
cubePositionFolder.add(cube.position, "x", -5, 5);
cubePositionFolder.add(cube.position, "z", -5, 5);
cubePositionFolder.open();
const cubeRotationFolder = cubeFolder.addFolder("Rotation");
cubeRotationFolder.add(cube.rotation, "x", 0, Math.PI * 2, 0.01);
cubeRotationFolder.add(cube.rotation, "y", 0, Math.PI * 2, 0.01);
cubeRotationFolder.add(cube.rotation, "z", 0, Math.PI * 2, 0.01);
cubeRotationFolder.open();
cubeFolder.open();
let myId = "";
let timestamp = 0;
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
    let pingStatsHtml = "Socket Ping Stats<br/><br/>";
    Object.keys(peers).forEach((p) => {
        timestamp = Date.now();
        pingStatsHtml += p + " " + (timestamp - peers[p].t) + "ms<br/>";
        if (p !== myId) {
            //console.log(peers[p])
            if (!peerCubes[p]) {
                //console.log("unknown peer" + p)
                peerCubes[p] = new THREE.Mesh(geometry, material);
                peerCubes[p].name = p;
                scene.add(peerCubes[p]);
            }
            else {
                if (peers[p]) {
                    tweens[p] = new TWEEN.Tween(peerCubes[p].position)
                        .to({
                        x: peers[p].p.x,
                        y: peers[p].p.y,
                        z: peers[p].p.z
                    }, 100)
                        .start();
                    tweens[p] = new TWEEN.Tween(peerCubes[p].rotation)
                        .to({
                        x: peers[p].r._x,
                        y: peers[p].r._y,
                        z: peers[p].r._z
                    }, 100)
                        .start();
                }
            }
        }
    });
    document.getElementById("pingStats").innerHTML = pingStatsHtml;
});
socket.on("removePeer", (id) => {
    scene.remove(scene.getObjectByName(id));
});
setInterval(() => {
    socket.emit("update", { t: Date.now(), p: cube.position, r: cube.rotation });
}, 100);
const animate = function () {
    requestAnimationFrame(animate);
    controls.update();
    TWEEN.update();
    camera.lookAt(cube.position);
    render();
    stats.update();
};
const render = function () {
    renderer.render(scene, camera);
};
animate();
