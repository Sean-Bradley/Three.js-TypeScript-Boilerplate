import XYController from './XYController.js';
import Explosion from './explosion.js';
import * as THREE from '/build/three.module.js';
import { TWEEN } from '/jsm/libs/tween.module.min';
import { OBJLoader } from '/jsm/loaders/OBJLoader';
import { Reflector } from '/jsm/objects/Reflector';
export default class TheBallGame {
    constructor(socket, scene, renderer) {
        this.gamePhase = 0;
        this.timestamp = 0;
        this.players = {};
        this.obstacles = {};
        this.myId = "";
        this.isMobile = false;
        //UI menu
        this.menuActive = true;
        this.recentWinnersTable = document.getElementById('recentWinnersTable');
        this.startButton = document.getElementById('startButton');
        this.menuPanel = document.getElementById('menuPanel');
        this.newGameAlert = document.getElementById('newGameAlert');
        this.gameClosedAlert = document.getElementById('gameClosedAlert');
        //UI Input    
        this.vec = [0, 0];
        this.spcKey = 0;
        this.keyMap = {};
        this.cameraRotationXZOffset = 0;
        this.cameraRotationYOffset = 0;
        this.radius = 4;
        this.sensitivity = 0.02;
        this.sphereGeometry = new THREE.SphereBufferGeometry(1, 24, 24);
        this.cubeGeometry = new THREE.BoxBufferGeometry(2, 2, 2);
        this.update = () => {
            TWEEN.update();
            if (this.jewel) {
                this.jewel.rotation.x += .01;
                this.jewel.rotation.y += .025;
            }
            this.explosions.forEach(e => {
                e.update();
            });
            if (this.players[this.myId]) {
                this.groundMirror.visible = false;
                this.players[this.myId].visible = false;
                this.cubeCamera1.position.copy(this.players[this.myId].position);
                this.cubeCamera1.update(this.renderer, this.scene);
                this.groundMirror.visible = true;
                this.players[this.myId].visible = true;
            }
        };
        //UI Input
        this.lockChangeAlert = () => {
            if (document.pointerLockElement === this.renderer.domElement || document.mozPointerLockElement === this.renderer.domElement) {
                this.renderer.domElement.addEventListener('mousemove', this.onDocumentMouseMove, false);
                this.renderer.domElement.addEventListener('mousewheel', this.onDocumentMouseWheel, false);
                document.addEventListener("keydown", this.onDocumentKey, false);
                document.addEventListener("keyup", this.onDocumentKey, false);
                this.menuPanel.style.display = 'none';
                this.menuActive = false;
            }
            else {
                this.renderer.domElement.removeEventListener('mousemove', this.onDocumentMouseMove, false);
                this.renderer.domElement.removeEventListener('mousewheel', this.onDocumentMouseWheel, false);
                document.removeEventListener("keydown", this.onDocumentKey, false);
                document.removeEventListener("keyup", this.onDocumentKey, false);
                this.menuPanel.style.display = 'block';
                this.gameClosedAlert.style.display = 'none';
                this.newGameAlert.style.display = 'none';
                this.menuActive = true;
            }
        };
        this.onDocumentKey = (e) => {
            this.keyMap[e.keyCode] = e.type == 'keydown';
            this.vec = [0, 0];
            if (this.keyMap[87]) { //w
                this.vec[0] += Math.cos(this.cameraRotationXZOffset);
                this.vec[1] -= Math.sin(this.cameraRotationXZOffset);
            }
            if (this.keyMap[83]) { //s
                this.vec[0] -= Math.cos(this.cameraRotationXZOffset);
                this.vec[1] += Math.sin(this.cameraRotationXZOffset);
            }
            if (this.keyMap[65]) { //a
                this.vec[0] += Math.sin(this.cameraRotationXZOffset);
                this.vec[1] += Math.cos(this.cameraRotationXZOffset);
            }
            if (this.keyMap[68]) { //d
                this.vec[0] -= Math.sin(this.cameraRotationXZOffset);
                this.vec[1] -= Math.cos(this.cameraRotationXZOffset);
            }
            if (this.keyMap[32]) { //space
                this.spcKey = 1;
            }
            else {
                this.spcKey = 0;
            }
        };
        this.onDocumentMouseWheel = (e) => {
            this.radius -= e.wheelDeltaY * 0.005;
            this.radius = Math.max(Math.min(this.radius, 20), 2);
        };
        this.onDocumentMouseMove = (e) => {
            this.cameraRotationXZOffset += (e.movementX * this.sensitivity / 5);
            this.cameraRotationYOffset += (e.movementY * this.sensitivity / 5);
            return false;
        };
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            this.isMobile = true;
        }
        //threejs
        this.scene = scene;
        this.renderer = renderer;
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.chaseCam = new THREE.Object3D();
        scene.add(this.chaseCam);
        this.ambientLight = new THREE.AmbientLight(0xffffff);
        scene.add(this.ambientLight);
        this.backGroundTexture = new THREE.CubeTextureLoader().load(["img/px_eso0932a.jpg", "img/nx_eso0932a.jpg", "img/py_eso0932a.jpg", "img/ny_eso0932a.jpg", "img/pz_eso0932a.jpg", "img/nz_eso0932a.jpg"]);
        scene.background = this.backGroundTexture;
        this.explosions = [
            new Explosion(new THREE.Color(0xff0000), scene),
            new Explosion(new THREE.Color(0x00ff00), scene),
            new Explosion(new THREE.Color(0x0000ff), scene)
        ];
        this.sphereMaterial = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load("img/marble.png"),
            envMap: scene.background,
            reflectivity: .66,
            combine: THREE.MixOperation,
            flatShading: false,
        });
        this.cubeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            envMap: scene.background,
            combine: THREE.MixOperation,
            reflectivity: .99
        });
        this.cubeRenderTarget1 = new THREE.WebGLCubeRenderTarget(128, { format: THREE.RGBFormat, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
        this.cubeCamera1 = new THREE.CubeCamera(.1, 100, this.cubeRenderTarget1);
        this.myMaterial = new THREE.MeshPhongMaterial({
            map: new THREE.TextureLoader().load("img/marble.png"),
            reflectivity: .66,
            color: 0xffffff,
            flatShading: false,
            envMap: this.cubeRenderTarget1.texture,
        });
        scene.add(this.cubeCamera1);
        this.objLoader = new OBJLoader();
        this.objLoader.load('models/jewel.obj', (object) => {
            object.traverse(function (child) {
                if (child.isMesh) {
                    child.material = new THREE.MeshMatcapMaterial({
                        matcap: new THREE.TextureLoader().load("img/jewel.png"),
                    });
                }
            });
            this.jewel = object;
            scene.add(this.jewel);
        }, (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        }, (error) => {
            console.log(error);
        });
        this.groundMirror = new Reflector(new THREE.PlaneBufferGeometry(50, 50), {
            color: new THREE.Color(0x222222),
            clipBias: 0.003,
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio
        });
        this.groundMirror.position.y = -.05;
        this.groundMirror.rotateX(-Math.PI / 2);
        scene.add(this.groundMirror);
        //sockets
        socket.on("connect", function () {
            console.log("connect");
        });
        socket.on("disconnect", (message) => {
            console.log("disconnect " + message);
            clearInterval(this.updateInterval);
            Object.keys(this.players).forEach(p => {
                scene.remove(this.players[p]);
            });
        });
        socket.on("joined", (id, screenName, recentWinners) => {
            this.myId = id;
            document.getElementById("screenNameInput").value = screenName;
            this.updateInterval = setInterval(() => {
                socket.emit("update", { t: Date.now(), vec: this.vec, spc: this.spcKey }); //, p: myObject3D.position, r: myObject3D.rotation })
            }, 50);
            this.updateScoreBoard(recentWinners);
        });
        socket.on("winner", (position, screenName, recentWinners) => {
            this.jewel.visible = false;
            this.explosions.forEach(e => {
                e.explode(position);
            });
            document.getElementById("winnerLabel").style.display = "block";
            document.getElementById("winnerScreenName").innerHTML = screenName;
            this.updateScoreBoard(recentWinners);
        });
        socket.on("newGame", () => {
            if (this.jewel) {
                this.jewel.visible = true;
            }
            this.gameClosedAlert.style.display = "none";
            if (!this.menuActive) {
                this.newGameAlert.style.display = "block";
                setTimeout(() => {
                    this.newGameAlert.style.display = "none";
                }, 2000);
            }
        });
        socket.on("removePlayer", (id) => {
            scene.remove(scene.getObjectByName(id));
        });
        socket.on("gameData", (gameData) => {
            if (gameData.gameClock >= 0) {
                if (this.gamePhase != 1) {
                    console.log("new game");
                    this.gamePhase = 1;
                    document.getElementById("gameClock").style.display = "block";
                    if (this.jewel) {
                        this.jewel.visible = true;
                    }
                    document.getElementById("winnerLabel").style.display = "none";
                    document.getElementById("winnerScreenName").innerHTML = "";
                }
                document.getElementById("gameClock").innerText = Math.floor(gameData.gameClock).toString();
            }
            else {
                if (this.jewel) {
                    this.jewel.visible = false;
                }
                document.getElementById("gameClock").style.display = "none";
                if (!this.menuActive && gameData.gameClock >= -3 && this.gamePhase === 1) {
                    console.log("game closed");
                    this.gameClosedAlert.style.display = "block";
                    setTimeout(() => {
                        this.gameClosedAlert.style.display = "none";
                    }, 4000);
                }
                this.gamePhase = 0;
            }
            let pingStatsHtml = "Socket Ping Stats<br/><br/>";
            Object.keys(gameData.players).forEach((p) => {
                this.timestamp = Date.now();
                pingStatsHtml += gameData.players[p].screenName + " " + (this.timestamp - gameData.players[p].t) + "ms<br/>";
                if (!this.players[p]) {
                    if (p === this.myId) {
                        this.players[p] = new THREE.Mesh(this.sphereGeometry, this.myMaterial);
                    }
                    else {
                        this.players[p] = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
                    }
                    this.players[p].name = p;
                    this.players[p].position.set(gameData.players[p].p.x, gameData.players[p].p.y, gameData.players[p].p.z);
                    scene.add(this.players[p]);
                }
                else {
                    if (gameData.players[p].p) {
                        new TWEEN.Tween(this.players[p].position)
                            .to({
                            x: gameData.players[p].p.x,
                            y: gameData.players[p].p.y,
                            z: gameData.players[p].p.z
                        }, 50)
                            .start();
                        if (p === this.myId) {
                            new TWEEN.Tween(this.camera.position)
                                .to({
                                x: this.players[this.myId].position.x + this.radius * Math.cos(this.cameraRotationXZOffset),
                                y: this.players[this.myId].position.y + this.radius * Math.atan(this.cameraRotationYOffset),
                                z: this.players[this.myId].position.z + this.radius * Math.sin(this.cameraRotationXZOffset)
                            }, 50)
                                .start();
                            new TWEEN.Tween(this.chaseCam.position)
                                .to({
                                x: this.players[this.myId].position.x,
                                y: this.players[this.myId].position.y + 1.5,
                                z: this.players[this.myId].position.z
                            }, 75)
                                .start()
                                .onUpdate(() => this.camera.lookAt(this.chaseCam.position));
                        }
                    }
                    if (gameData.players[p].q) {
                        new TWEEN.Tween(this.players[p].quaternion)
                            .to({
                            _x: gameData.players[p].q.x,
                            _y: gameData.players[p].q.y,
                            _z: gameData.players[p].q.z,
                            _w: gameData.players[p].q.w
                        }, 50)
                            .start()
                            .onUpdate(() => this.players[p].quaternion.normalize());
                    }
                }
            });
            Object.keys(gameData.obstacles).forEach((o) => {
                if (!this.obstacles[o]) {
                    if (gameData.obstacles[o].p) {
                        this.obstacles[o] = new THREE.Mesh(this.cubeGeometry, this.cubeMaterial);
                        this.obstacles[o].name = o;
                        this.obstacles[o].position.set(gameData.obstacles[o].p.x, gameData.obstacles[o].p.y, gameData.obstacles[o].p.z);
                        scene.add(this.obstacles[o]);
                    }
                }
                else {
                    if (gameData.obstacles[o].p) {
                        new TWEEN.Tween(this.obstacles[o].position)
                            .to({
                            x: gameData.obstacles[o].p.x,
                            y: gameData.obstacles[o].p.y,
                            z: gameData.obstacles[o].p.z
                        }, 50)
                            .start();
                    }
                    if (gameData.obstacles[o].q) {
                        new TWEEN.Tween(this.obstacles[o].quaternion)
                            .to({
                            x: gameData.obstacles[o].q.x,
                            y: gameData.obstacles[o].q.y,
                            z: gameData.obstacles[o].q.z,
                            w: gameData.obstacles[o].q.w
                        }, 50)
                            .start();
                    }
                    if (gameData.obstacles[o].s) {
                        new TWEEN.Tween(this.obstacles[o].scale)
                            .to({
                            x: gameData.obstacles[o].s.x,
                            y: gameData.obstacles[o].s.y,
                            z: gameData.obstacles[o].s.z
                        }, 50)
                            .start();
                    }
                }
            });
            if (this.jewel && gameData.jewel) {
                if (gameData.jewel.p) {
                    new TWEEN.Tween(this.jewel.position)
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
        this.startButton.addEventListener('click', () => {
            if (this.isMobile) {
                this.xycontrollerLook = new XYController(document.getElementById("XYControllerLook"), this.onXYControllerLook);
                this.xycontrollerMove = new XYController(document.getElementById("XYControllerMove"), this.onXYControllerMove);
                this.menuPanel.style.display = 'none';
                this.menuActive = false;
            }
            else {
                this.renderer.domElement.requestPointerLock();
            }
        }, false);
        document.addEventListener('pointerlockchange', this.lockChangeAlert, false);
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
    }
    //for UI
    updateScoreBoard(recentWinners) {
        const rows = this.recentWinnersTable.rows;
        var i = rows.length;
        while (--i) {
            this.recentWinnersTable.deleteRow(i);
        }
        recentWinners.forEach(w => {
            const row = this.recentWinnersTable.insertRow();
            const cell0 = row.insertCell(0);
            cell0.appendChild(document.createTextNode(w.screenName));
            const cell1 = row.insertCell(1);
            cell1.appendChild(document.createTextNode(w.time));
        });
    }
    onXYControllerLook(value) {
        //console.log(value)
        this.cameraRotationXZOffset -= (value.x) * .1;
        this.cameraRotationYOffset += (value.y) * .1;
        return false;
    }
    onXYControllerMove(value) {
        this.vec = [0, 0];
        if (value.y > 0) { //w
            this.vec[0] += Math.cos(this.cameraRotationXZOffset) * .25;
            this.vec[1] -= Math.sin(this.cameraRotationXZOffset) * .25;
        }
        if (value.y < 0) { //s
            this.vec[0] -= Math.cos(this.cameraRotationXZOffset) * .25;
            this.vec[1] += Math.sin(this.cameraRotationXZOffset) * .25;
        }
        if (value.x > 0) { //a
            this.vec[0] += Math.sin(this.cameraRotationXZOffset) * .25;
            this.vec[1] += Math.cos(this.cameraRotationXZOffset) * .25;
        }
        if (value.x < 0) { //d
            this.vec[0] -= Math.sin(this.cameraRotationXZOffset) * .25;
            this.vec[1] -= Math.cos(this.cameraRotationXZOffset) * .25;
        }
        return false;
    }
}
