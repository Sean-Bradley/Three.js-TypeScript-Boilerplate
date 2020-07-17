import * as THREE from '/build/three.module.js';
import Stats from '/jsm/libs/stats.module';
import { TWEEN } from '/jsm/libs/tween.module.min';
import { Reflector } from '/jsm/objects/Reflector';
import { OBJLoader } from '/jsm/loaders/OBJLoader';
import Explosion from './explosion.js';
let gamePhase = 0;
const scene = new THREE.Scene();
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const chaseCam = new THREE.Object3D();
scene.add(chaseCam);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const menuPanel = document.getElementById('menuPanel');
const startButton = document.getElementById('startButton');
const newGameAlert = document.getElementById('newGameAlert');
const gameClosedAlert = document.getElementById('gameClosedAlert');
const recentWinnersTable = document.getElementById('recentWinnersTable');
let menuActive = true;
startButton.addEventListener('click', function () {
    renderer.domElement.requestPointerLock();
}, false);
document.addEventListener('pointerlockchange', lockChangeAlert, false);
function lockChangeAlert() {
    if (document.pointerLockElement === renderer.domElement || document.mozPointerLockElement === renderer.domElement) {
        renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
        renderer.domElement.addEventListener('mousewheel', onDocumentMouseWheel, false);
        document.addEventListener("keydown", onDocumentKey, false);
        document.addEventListener("keyup", onDocumentKey, false);
        menuPanel.style.display = 'none';
        menuActive = false;
    }
    else {
        renderer.domElement.removeEventListener('mousemove', onDocumentMouseMove, false);
        renderer.domElement.removeEventListener('mousewheel', onDocumentMouseWheel, false);
        document.removeEventListener("keydown", onDocumentKey, false);
        document.removeEventListener("keyup", onDocumentKey, false);
        menuPanel.style.display = 'block';
        gameClosedAlert.style.display = 'none';
        newGameAlert.style.display = 'none';
        menuActive = true;
    }
}
document.getElementById('screenNameInput').addEventListener('keyup', (e) => {
    if (e.which === 13)
        blur();
});
document.getElementById('screenNameInput').addEventListener("change", (e) => {
    var letterNumber = /^[0-9a-zA-Z]+$/;
    var value = e.target.value;
    if (value.match(letterNumber) && value.length <= 12) {
        socket.emit("updateScreenName", e.target.value);
    }
    else {
        alert("Alphanumeric screen names only please. Max length 12");
    }
});
const backGroundTexture = new THREE.CubeTextureLoader().load(["img/px_eso0932a.jpg", "img/nx_eso0932a.jpg", "img/py_eso0932a.jpg", "img/ny_eso0932a.jpg", "img/pz_eso0932a.jpg", "img/nz_eso0932a.jpg"]);
scene.background = backGroundTexture;
const texture = new THREE.TextureLoader().load("img/marble.png");
let jewel;
const objLoader = new OBJLoader();
objLoader.load('models/jewel.obj', (object) => {
    object.traverse(function (child) {
        if (child.isMesh) {
            child.material = jewelMaterial;
        }
    });
    jewel = object;
    scene.add(jewel);
}, (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
}, (error) => {
    console.log(error);
});
const sphereGeometry = new THREE.SphereBufferGeometry(1, 24, 24);
const cubeGeometry = new THREE.BoxBufferGeometry(2, 2, 2);
const sphereMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    envMap: scene.background,
    reflectivity: .66,
    combine: THREE.MixOperation,
    flatShading: false,
});
const cubeMaterial = new THREE.MeshBasicMaterial({
    //map: texture,
    color: 0xffffff,
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    envMap: scene.background,
    combine: THREE.MixOperation,
    reflectivity: .99
});
const cubeRenderTarget1 = new THREE.WebGLCubeRenderTarget(128, { format: THREE.RGBFormat, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
const cubeCamera1 = new THREE.CubeCamera(.1, 100, cubeRenderTarget1);
const myMaterial = new THREE.MeshPhongMaterial({
    map: texture,
    reflectivity: .66,
    color: 0xffffff,
    flatShading: false,
    envMap: cubeRenderTarget1.texture,
});
scene.add(cubeCamera1);
const jewelMaterial = new THREE.MeshMatcapMaterial({
    matcap: new THREE.TextureLoader().load("img/jewel.png"),
});
const groundMirror = new Reflector(new THREE.PlaneBufferGeometry(50, 50), {
    color: new THREE.Color(0x222222),
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio
});
groundMirror.position.y = -.05;
groundMirror.rotateX(-Math.PI / 2);
scene.add(groundMirror);
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
const explosions = [
    new Explosion(new THREE.Color(0xff0000), scene),
    new Explosion(new THREE.Color(0x00ff00), scene),
    new Explosion(new THREE.Color(0x0000ff), scene)
];
let updateInterval;
let myId = "";
let timestamp = 0;
const players = {};
const obstacles = {};
const socket = io();
socket.on("connect", function () {
    console.log("connect");
});
socket.on("disconnect", function (message) {
    console.log("disconnect " + message);
    clearInterval(updateInterval);
    Object.keys(players).forEach(p => {
        scene.remove(players[p]);
    });
});
socket.on("joined", (id, screenName, recentWinners) => {
    myId = id;
    document.getElementById("screenNameInput").value = screenName;
    updateInterval = setInterval(() => {
        socket.emit("update", { t: Date.now(), vec: vec, spc: spcKey }); //, p: myObject3D.position, r: myObject3D.rotation })
    }, 50);
    updateScoreBoard(recentWinners);
});
socket.on("winner", (position, screenName, recentWinners) => {
    jewel.visible = false;
    explosions.forEach(e => {
        e.explode(position);
    });
    document.getElementById("winnerLabel").style.display = "block";
    document.getElementById("winnerScreenName").innerHTML = screenName;
    updateScoreBoard(recentWinners);
});
socket.on("newGame", () => {
    jewel.visible = true;
    gameClosedAlert.style.display = "none";
    if (!menuActive) {
        newGameAlert.style.display = "block";
        setTimeout(() => {
            newGameAlert.style.display = "none";
        }, 2000);
    }
});
socket.on("gameData", (gameData) => {
    if (gameData.gameClock >= 0) {
        if (gamePhase != 1) {
            console.log("new game");
            gamePhase = 1;
            document.getElementById("gameClock").style.display = "block";
            jewel.visible = true;
            document.getElementById("winnerLabel").style.display = "none";
            document.getElementById("winnerScreenName").innerHTML = "";
        }
        document.getElementById("gameClock").innerText = Math.floor(gameData.gameClock).toString();
    }
    else {
        //gameClosedAlert        
        jewel.visible = false;
        document.getElementById("gameClock").style.display = "none";
        if (!menuActive && gameData.gameClock >= -3 && gamePhase === 1) {
            console.log("game closed");
            gameClosedAlert.style.display = "block";
            setTimeout(() => {
                gameClosedAlert.style.display = "none";
            }, 4000);
        }
        gamePhase = 0;
    }
    let pingStatsHtml = "Socket Ping Stats<br/><br/>";
    Object.keys(gameData.players).forEach((p) => {
        timestamp = Date.now();
        pingStatsHtml += gameData.players[p].screenName + " " + (timestamp - gameData.players[p].t) + "ms<br/>";
        if (!players[p]) {
            if (p === myId) {
                players[p] = new THREE.Mesh(sphereGeometry, myMaterial);
            }
            else {
                players[p] = new THREE.Mesh(sphereGeometry, sphereMaterial);
            }
            players[p].name = p;
            players[p].position.set(gameData.players[p].p.x, gameData.players[p].p.y, gameData.players[p].p.z);
            scene.add(players[p]);
        }
        else {
            if (gameData.players[p].p) {
                new TWEEN.Tween(players[p].position)
                    .to({
                    x: gameData.players[p].p.x,
                    y: gameData.players[p].p.y,
                    z: gameData.players[p].p.z
                }, 50)
                    .start();
                if (p === myId) {
                    new TWEEN.Tween(camera.position)
                        .to({
                        x: players[myId].position.x + radius * Math.cos(cameraRotationXZOffset),
                        y: players[myId].position.y + radius * Math.atan(cameraRotationYOffset),
                        z: players[myId].position.z + radius * Math.sin(cameraRotationXZOffset)
                    }, 50)
                        .start();
                    new TWEEN.Tween(chaseCam.position)
                        .to({
                        x: players[myId].position.x,
                        y: players[myId].position.y + 1.5,
                        z: players[myId].position.z
                    }, 75)
                        .start()
                        .onUpdate(() => camera.lookAt(chaseCam.position));
                }
            }
            if (gameData.players[p].q) {
                new TWEEN.Tween(players[p].quaternion)
                    .to({
                    _x: gameData.players[p].q.x,
                    _y: gameData.players[p].q.y,
                    _z: gameData.players[p].q.z,
                    _w: gameData.players[p].q.w
                }, 50)
                    .start()
                    .onUpdate(() => players[p].quaternion.normalize());
            }
        }
    });
    Object.keys(gameData.obstacles).forEach((o) => {
        if (!obstacles[o]) {
            if (gameData.obstacles[o].p) {
                obstacles[o] = new THREE.Mesh(cubeGeometry, cubeMaterial);
                obstacles[o].name = o;
                obstacles[o].position.set(gameData.obstacles[o].p.x, gameData.obstacles[o].p.y, gameData.obstacles[o].p.z);
                scene.add(obstacles[o]);
            }
        }
        else {
            if (gameData.obstacles[o].p) {
                new TWEEN.Tween(obstacles[o].position)
                    .to({
                    x: gameData.obstacles[o].p.x,
                    y: gameData.obstacles[o].p.y,
                    z: gameData.obstacles[o].p.z
                }, 50)
                    .start();
            }
            if (gameData.obstacles[o].q) {
                new TWEEN.Tween(obstacles[o].quaternion)
                    .to({
                    x: gameData.obstacles[o].q.x,
                    y: gameData.obstacles[o].q.y,
                    z: gameData.obstacles[o].q.z,
                    w: gameData.obstacles[o].q.w
                }, 50)
                    .start();
            }
            if (gameData.obstacles[o].s) {
                new TWEEN.Tween(obstacles[o].scale)
                    .to({
                    x: gameData.obstacles[o].s.x,
                    y: gameData.obstacles[o].s.y,
                    z: gameData.obstacles[o].s.z
                }, 50)
                    .start();
            }
        }
    });
    if (gameData.jewel) {
        if (gameData.jewel.p) {
            new TWEEN.Tween(jewel.position)
                .to({
                x: gameData.jewel.p.x,
                y: gameData.jewel.p.y,
                z: gameData.jewel.p.z
            }, 50)
                .start();
        }
    }
    document.getElementById("pingStats").innerHTML = pingStatsHtml;
});
socket.on("removePlayer", (id) => {
    scene.remove(scene.getObjectByName(id));
});
function updateScoreBoard(recentWinners) {
    const rows = recentWinnersTable.rows;
    var i = rows.length;
    while (--i) {
        recentWinnersTable.deleteRow(i);
    }
    recentWinners.forEach(w => {
        const row = recentWinnersTable.insertRow();
        const cell0 = row.insertCell(0);
        cell0.appendChild(document.createTextNode(w.screenName));
        const cell1 = row.insertCell(1);
        cell1.appendChild(document.createTextNode(w.time));
    });
}
let cameraRotationXZOffset = 0;
let cameraRotationYOffset = 0;
let radius = 4;
const sensitivity = 0.02;
function onDocumentMouseWheel(event) {
    radius -= event.wheelDeltaY * 0.005;
    radius = Math.max(Math.min(radius, 20), 2);
}
function onDocumentMouseMove(event) {
    cameraRotationXZOffset += (event.movementX * sensitivity / 5);
    cameraRotationYOffset += (event.movementY * sensitivity / 5);
    return false;
}
let vec = [0, 0];
let spcKey = 0;
let keyMap = {};
function onDocumentKey(e) {
    keyMap[e.keyCode] = e.type == 'keydown';
    vec = [0, 0];
    if (keyMap[87]) { //w
        vec[0] += Math.cos(cameraRotationXZOffset);
        vec[1] -= Math.sin(cameraRotationXZOffset);
    }
    if (keyMap[83]) { //s
        vec[0] -= Math.cos(cameraRotationXZOffset);
        vec[1] += Math.sin(cameraRotationXZOffset);
    }
    if (keyMap[65]) { //a
        vec[0] += Math.sin(cameraRotationXZOffset);
        vec[1] += Math.cos(cameraRotationXZOffset);
    }
    if (keyMap[68]) { //d
        vec[0] -= Math.sin(cameraRotationXZOffset);
        vec[1] -= Math.cos(cameraRotationXZOffset);
    }
    if (keyMap[32]) { //space
        spcKey = 1;
    }
    else {
        spcKey = 0;
    }
}
;
const stats = Stats();
document.body.appendChild(stats.dom);
const animate = function () {
    if (jewel) {
        jewel.rotation.x += .01;
        jewel.rotation.y += .025;
    }
    explosions.forEach(e => {
        e.update();
    });
    render();
    stats.update();
    requestAnimationFrame(animate);
};
const render = function () {
    TWEEN.update();
    if (players[myId]) {
        groundMirror.visible = false;
        players[myId].visible = false;
        cubeCamera1.position.copy(players[myId].position);
        cubeCamera1.update(renderer, scene);
        groundMirror.visible = true;
        players[myId].visible = true;
    }
    renderer.render(scene, camera);
};
animate();
