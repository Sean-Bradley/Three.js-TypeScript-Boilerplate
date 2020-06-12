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
let myObject3D = new THREE.Object3D();
myObject3D.position.x = (Math.random() * 4) - 2;
myObject3D.position.z = (Math.random() * 4) - 2;
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
let myId = "";
let timestamp = 0;
const peerCubes = {};
const socket = io();
socket.on("connect", function () {
    console.log("connect");
});
socket.on("disconnect", function (message) {
    console.log("disconnect " + message);
});
socket.on("id", (id) => {
    myId = id;
    setInterval(() => {
        socket.emit("update", { t: Date.now(), p: myObject3D.position, r: myObject3D.rotation });
    }, 50);
});
socket.on("peers", (peers) => {
    let pingStatsHtml = "Socket Ping Stats<br/><br/>";
    Object.keys(peers).forEach((p) => {
        timestamp = Date.now();
        pingStatsHtml += p + " " + (timestamp - peers[p].t) + "ms<br/>";
        if (!peerCubes[p]) {
            peerCubes[p] = new THREE.Mesh(geometry, material);
            peerCubes[p].name = p;
            scene.add(peerCubes[p]);
        }
        else {
            if (peers[p].p) {
                new TWEEN.Tween(peerCubes[p].position)
                    .to({
                    x: peers[p].p.x,
                    y: peers[p].p.y,
                    z: peers[p].p.z
                }, 50)
                    .start();
            }
            if (peers[p].r) {
                new TWEEN.Tween(peerCubes[p].rotation)
                    .to({
                    x: peers[p].r._x,
                    y: peers[p].r._y,
                    z: peers[p].r._z
                }, 50)
                    .start();
            }
        }
    });
    Object.keys(peerCubes).forEach((p) => {
        if (!peers[p]) {
            scene.remove(scene.getObjectByName(p));
        }
    });
    document.getElementById("pingStats").innerHTML = pingStatsHtml;
});
socket.on("removePeer", (id) => {
    scene.remove(scene.getObjectByName(id));
});
const stats = Stats();
document.body.appendChild(stats.dom);
const gui = new GUI();
const cubeFolder = gui.addFolder("Cube");
const cubePositionFolder = cubeFolder.addFolder("Position");
cubePositionFolder.add(myObject3D.position, "x", -5, 5);
cubePositionFolder.add(myObject3D.position, "z", -5, 5);
cubePositionFolder.open();
const cubeRotationFolder = cubeFolder.addFolder("Rotation");
cubeRotationFolder.add(myObject3D.rotation, "x", 0, Math.PI * 2, 0.01);
cubeRotationFolder.add(myObject3D.rotation, "y", 0, Math.PI * 2, 0.01);
cubeRotationFolder.add(myObject3D.rotation, "z", 0, Math.PI * 2, 0.01);
cubeRotationFolder.open();
cubeFolder.open();
const animate = function () {
    requestAnimationFrame(animate);
    controls.update();
    TWEEN.update();
    if (peerCubes[myId]) {
        camera.lookAt(peerCubes[myId].position);
    }
    render();
    stats.update();
};
const render = function () {
    renderer.render(scene, camera);
};
animate();
