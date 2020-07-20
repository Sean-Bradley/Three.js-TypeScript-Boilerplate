import XYController from './XYController.js'
import Explosion from './explosion.js'
import * as THREE from '/build/three.module.js'
import { TWEEN } from '/jsm/libs/tween.module.min'
import { OBJLoader } from '/jsm/loaders/OBJLoader'
import { Reflector } from '/jsm/objects/Reflector'

export default class TheBallGame {

    public gamePhase: number = 0
    private timestamp = 0


    public players: { [id: string]: THREE.Mesh } = {}
    public obstacles: { [id: string]: THREE.Mesh } = {}


    private updateInterval
    public myId: string = ""

    public isMobile: boolean = false

    //UI menu
    public menuActive: boolean = true
    private recentWinnersTable: HTMLTableElement = document.getElementById('recentWinnersTable') as HTMLTableElement;
    private startButton = document.getElementById('startButton');
    public menuPanel = document.getElementById('menuPanel');
    public newGameAlert = document.getElementById('newGameAlert');
    public gameClosedAlert = document.getElementById('gameClosedAlert');


    //UI Input    
    public vec = [0, 0]
    private spcKey: number = 0
    private keyMap: { [id: number]: boolean } = {}

    public xycontrollerLook: XYController
    public xycontrollerMove: XYController


    //scene
    private scene: THREE.Scene
    private renderer: THREE.WebGLRenderer
    public camera: THREE.PerspectiveCamera
    //private chaseCam: THREE.Object3D
    private ambientLight: THREE.AmbientLight
    private backGroundTexture: THREE.CubeTexture
    private cameraRotationXZOffset: number = 0
    private cameraRotationYOffset: number = 0
    private radius: number = 4
    private sensitivity: number = 0.004
    private jewel: THREE.Object3D
    private explosions: Explosion[]
    private sphereGeometry: THREE.SphereBufferGeometry = new THREE.SphereBufferGeometry(1, 24, 24)
    private cubeGeometry: THREE.BoxBufferGeometry = new THREE.BoxBufferGeometry(2, 2, 2)
    private sphereMaterial: THREE.MeshBasicMaterial
    private cubeMaterial: THREE.MeshBasicMaterial
    private cubeRenderTarget1: THREE.WebGLCubeRenderTarget
    private cubeCamera1: THREE.CubeCamera
    private myMaterial: THREE.MeshPhongMaterial
    private objLoader: OBJLoader
    private jewelMaterial: THREE.MeshMatcapMaterial
    private groundMirror: Reflector

    constructor(socket: SocketIOClient.Socket, scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera) {

        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            this.isMobile = true
        }

        //threejs
        this.scene = scene
        this.renderer = renderer
        this.camera = camera

        // this.chaseCam = new THREE.Mesh(
        //     new THREE.BoxBufferGeometry(),
        //     new THREE.MeshBasicMaterial({ wireframe: true })
        // ) 
        //this.chaseCam = new THREE.Object3D()
        //scene.add(this.chaseCam)

        this.ambientLight = new THREE.AmbientLight(0xffffff);
        scene.add(this.ambientLight);

        this.backGroundTexture = new THREE.CubeTextureLoader().load(["img/px_eso0932a.jpg", "img/nx_eso0932a.jpg", "img/py_eso0932a.jpg", "img/ny_eso0932a.jpg", "img/pz_eso0932a.jpg", "img/nz_eso0932a.jpg"]);
        scene.background = this.backGroundTexture

        this.explosions = [
            new Explosion(new THREE.Color(0xff0000), scene),
            new Explosion(new THREE.Color(0x00ff00), scene),
            new Explosion(new THREE.Color(0x0000ff), scene)
        ]

        this.sphereMaterial = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load("img/marble.png"),
            envMap: scene.background,
            reflectivity: .66,
            combine: THREE.MixOperation,
            flatShading: false,
        })
        this.cubeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            envMap: scene.background,
            combine: THREE.MixOperation,
            reflectivity: .99
        })
        this.cubeRenderTarget1 = new THREE.WebGLCubeRenderTarget(128, { format: THREE.RGBFormat, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
        this.cubeCamera1 = new THREE.CubeCamera(.1, 100, this.cubeRenderTarget1);
        this.myMaterial = new THREE.MeshPhongMaterial({
            map: new THREE.TextureLoader().load("img/marble.png"),
            reflectivity: .66,
            color: 0xffffff,
            flatShading: false,
            envMap: this.cubeRenderTarget1.texture,
        });
        scene.add(this.cubeCamera1)

        this.objLoader = new OBJLoader()
        this.objLoader.load(
            'models/jewel.obj',
            (object: THREE.Group) => {
                object.traverse(function (child) {
                    if ((<THREE.Mesh>child).isMesh) {
                        (<THREE.Mesh>child).material = new THREE.MeshMatcapMaterial({
                            matcap: new THREE.TextureLoader().load("img/jewel.png"),
                        })
                    }
                })
                this.jewel = object
                scene.add(this.jewel);
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded')
            },
            (error) => {
                console.log(error);
            }
        )

        this.groundMirror = new Reflector(new THREE.PlaneBufferGeometry(50, 50), {
            color: new THREE.Color(0x222222),
            clipBias: 0.003,
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio
        });
        this.groundMirror.position.y = -.05
        this.groundMirror.rotateX(- Math.PI / 2);
        scene.add(this.groundMirror);


        //sockets
        socket.on("connect", function () {
            console.log("connect")
        })
        socket.on("disconnect", (message: any) => {
            console.log("disconnect " + message)
            clearInterval(this.updateInterval);
            Object.keys(this.players).forEach(p => {
                scene.remove(this.players[p])
            })
        })
        socket.on("joined", (id: string, screenName: string, recentWinners: []) => {
            this.myId = id;
            (document.getElementById("screenNameInput") as HTMLInputElement).value = screenName

            this.updateInterval = setInterval(() => {
                socket.emit("update", { t: Date.now(), vec: this.vec, spc: this.spcKey }) //, p: myObject3D.position, r: myObject3D.rotation })
            }, 50)
            this.updateScoreBoard(recentWinners)
        })

        socket.on("winner", (position: THREE.Vector3, screenName: string, recentWinners: any[]) => {
            this.jewel.visible = false
            this.explosions.forEach(e => {
                e.explode(position)
            })
            document.getElementById("winnerLabel").style.display = "block"
            document.getElementById("winnerScreenName").innerHTML = screenName
            this.updateScoreBoard(recentWinners)
        })

        socket.on("newGame", () => {
            if (this.jewel) {
                this.jewel.visible = true
            }
            this.gameClosedAlert.style.display = "none"
            if (!this.menuActive) {
                this.newGameAlert.style.display = "block"
                setTimeout(() => {
                    this.newGameAlert.style.display = "none"
                }, 2000)
            }
        })

        socket.on("removePlayer", (id: string) => {
            scene.remove(scene.getObjectByName(id));
        })

        //let lastTime = Date.now()
        socket.on("gameData", (gameData: any) => {
            // const now = Date.now()
            // const dt = (now - lastTime) /// 2
            // lastTime = now
            // //if (dt > 55) {
            // console.log(dt)
            // //}
            if (gameData.gameClock >= 0) {
                if (this.gamePhase != 1) {
                    console.log("new game")
                    this.gamePhase = 1
                    document.getElementById("gameClock").style.display = "block"
                    if (this.jewel) {
                        this.jewel.visible = true
                    }
                    document.getElementById("winnerLabel").style.display = "none"
                    document.getElementById("winnerScreenName").innerHTML = ""
                }
                document.getElementById("gameClock").innerText = Math.floor(gameData.gameClock).toString()
            } else {
                if (this.jewel) {
                    this.jewel.visible = false
                }
                document.getElementById("gameClock").style.display = "none"
                if (!this.menuActive && gameData.gameClock >= -3 && this.gamePhase === 1) {
                    console.log("game closed")
                    this.gameClosedAlert.style.display = "block"
                    setTimeout(() => {
                        this.gameClosedAlert.style.display = "none"
                    }, 4000)
                }
                this.gamePhase = 0

            }
            let pingStatsHtml = "Socket Ping Stats<br/><br/>"
            Object.keys(gameData.players).forEach((p) => {
                this.timestamp = Date.now()
                pingStatsHtml += gameData.players[p].screenName + " " + (this.timestamp - gameData.players[p].t) + "ms<br/>"
                if (!this.players[p]) {
                    if (p === this.myId) {
                        this.players[p] = new THREE.Mesh(this.sphereGeometry, this.myMaterial)
                    } else {
                        this.players[p] = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial)
                    }
                    this.players[p].name = p
                    this.players[p].position.set(gameData.players[p].p.x, gameData.players[p].p.y, gameData.players[p].p.z)
                    scene.add(this.players[p])
                } else {
                    if (gameData.players[p].p) {

                        if (p === this.myId) {
                            new TWEEN.Tween(this.players[p].position)
                                .to({
                                    x: gameData.players[p].p.x,
                                    y: gameData.players[p].p.y,
                                    z: gameData.players[p].p.z
                                }, 50)
                                .start()
                                .onUpdate(() => {
                                    this.camera.position.set(
                                        this.players[p].position.x + this.radius * Math.cos(this.cameraRotationXZOffset),
                                        this.players[p].position.y + this.radius * Math.atan(this.cameraRotationYOffset),
                                        this.players[p].position.z + this.radius * Math.sin(this.cameraRotationXZOffset)
                                    )
                                    this.camera.lookAt(
                                        this.players[this.myId].position.x,
                                        this.players[this.myId].position.y + 1.5,
                                        this.players[this.myId].position.z)
                                })

                            // new TWEEN.Tween(this.chaseCam.position)
                            //     .to({
                            //         x: this.players[p].position.x,
                            //         y: this.players[p].position.y + 1.5,
                            //         z: this.players[p].position.z
                            //     }, 100)
                            //     .start()
                            //     .onUpdate(() => this.camera.lookAt(this.chaseCam.position))
                        } else {
                            new TWEEN.Tween(this.players[p].position)
                                .to({
                                    x: gameData.players[p].p.x,
                                    y: gameData.players[p].p.y,
                                    z: gameData.players[p].p.z
                                }, 50)
                                .start()
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
                            .onUpdate(() => this.players[p].quaternion.normalize())
                    }
                }
            })
            Object.keys(gameData.obstacles).forEach((o) => {
                if (!this.obstacles[o]) {
                    if (gameData.obstacles[o].p) {
                        this.obstacles[o] = new THREE.Mesh(this.cubeGeometry, this.cubeMaterial)
                        this.obstacles[o].name = o
                        this.obstacles[o].position.set(gameData.obstacles[o].p.x, gameData.obstacles[o].p.y, gameData.obstacles[o].p.z)
                        scene.add(this.obstacles[o])
                    }
                } else {
                    if (gameData.obstacles[o].p) {
                        new TWEEN.Tween(this.obstacles[o].position)
                            .to({
                                x: gameData.obstacles[o].p.x,
                                y: gameData.obstacles[o].p.y,
                                z: gameData.obstacles[o].p.z
                            }, 50)
                            .start()
                    }
                    if (gameData.obstacles[o].q) {
                        new TWEEN.Tween(this.obstacles[o].quaternion)
                            .to({
                                x: gameData.obstacles[o].q.x,
                                y: gameData.obstacles[o].q.y,
                                z: gameData.obstacles[o].q.z,
                                w: gameData.obstacles[o].q.w
                            }, 50)
                            .start()
                    }
                    if (gameData.obstacles[o].s) {
                        new TWEEN.Tween(this.obstacles[o].scale)
                            .to({
                                x: gameData.obstacles[o].s.x,
                                y: gameData.obstacles[o].s.y,
                                z: gameData.obstacles[o].s.z
                            }, 50)
                            .start()
                    }
                }
            })
            if (this.jewel && gameData.jewel) {
                if (gameData.jewel.p) {
                    new TWEEN.Tween(this.jewel.position)
                        .to({
                            x: gameData.jewel.p.x,
                            y: gameData.jewel.p.y,
                            z: gameData.jewel.p.z
                        }, 50)
                        .start()
                }
            }
            document.getElementById("pingStats").innerHTML = pingStatsHtml
        })

        this.startButton.addEventListener('click', () => {
            if (this.isMobile) {
                this.xycontrollerLook = new XYController(document.getElementById("XYControllerLook") as HTMLCanvasElement, this.onXYControllerLook)
                this.xycontrollerMove = new XYController(document.getElementById("XYControllerMove") as HTMLCanvasElement, this.onXYControllerMove)

                this.menuPanel.style.display = 'none';
                this.recentWinnersTable.style.display = 'block';
                this.menuActive = false

            } else {
                this.renderer.domElement.requestPointerLock();
            }
        }, false);

        document.addEventListener('pointerlockchange', this.lockChangeAlert, false);

        document.getElementById('screenNameInput').addEventListener('keyup', (e) => {
            if (e.which === 13) blur();
        })
        document.getElementById('screenNameInput').addEventListener("change", (e) => {
            var letterNumber = /^[0-9a-zA-Z]+$/;
            var value = (e.target as HTMLFormElement).value
            if (value.match(letterNumber) && value.length <= 12) {
                socket.emit("updateScreenName", (e.target as HTMLFormElement).value)
            }
            else {
                alert("Alphanumeric screen names only please. Max length 12")
            }
        })
    }

    //private lastPos:THREE.Vector3 = new THREE.Vector3()

    public update = () => {


        if (this.jewel) {
            this.jewel.rotation.x += .01
            this.jewel.rotation.y += .025
        }

        this.explosions.forEach(e => {
            e.update()
        })

        if (this.players[this.myId]) {
            this.groundMirror.visible = false
            this.players[this.myId].visible = false
            this.cubeCamera1.position.copy(this.players[this.myId].position)
            this.cubeCamera1.update(this.renderer, this.scene);
            this.groundMirror.visible = true
            this.players[this.myId].visible = true
        }

        TWEEN.update();

        // this.chaseCam.position.set(
        //     this.players[this.myId].position.x,
        //     this.players[this.myId].position.y + 1.5,
        //     this.players[this.myId].position.z
        // )
        // let diffX = this.lastPos.x - this.players[this.myId].position.x
        // let diffY = this.lastPos.y - (this.players[this.myId].position.y)// + 1.5)
        // let diffZ = this.lastPos.z - this.players[this.myId].position.z
        // this.chaseCam.position.x = this.lastPos.x + ((this.players[this.myId].position.x - this.lastPos.x) / 5)
        // this.chaseCam.position.y = this.lastPos.y + ((this.players[this.myId].position.y - this.lastPos.y) / 5) + .15
        // this.chaseCam.position.z = this.lastPos.z + ((this.players[this.myId].position.z - this.lastPos.z) / 5)
        // this.camera.lookAt(this.chaseCam.position)
        // this.lastPos = this.chaseCam.position

        //lastPos + (now - (lastPos /2))
    }

    //for UI
    public updateScoreBoard(recentWinners) {
        const rows = this.recentWinnersTable.rows;
        var i = rows.length;
        while (--i) {
            this.recentWinnersTable.deleteRow(i);
        }

        recentWinners.forEach(w => {
            const row = this.recentWinnersTable.insertRow()
            const cell0 = row.insertCell(0)
            cell0.appendChild(document.createTextNode(w.screenName))
            const cell1 = row.insertCell(1)
            cell1.appendChild(document.createTextNode(w.time))
        });
    }


    //UI Input
    public lockChangeAlert = () => {
        if (document.pointerLockElement === this.renderer.domElement || (document as any).mozPointerLockElement === this.renderer.domElement) {
            this.renderer.domElement.addEventListener('mousemove', this.onDocumentMouseMove, false);
            this.renderer.domElement.addEventListener('mousewheel', this.onDocumentMouseWheel, false);
            document.addEventListener("keydown", this.onDocumentKey, false);
            document.addEventListener("keyup", this.onDocumentKey, false);

            this.menuPanel.style.display = 'none';
            this.recentWinnersTable.style.display = 'block';
            this.menuActive = false
        } else {
            this.renderer.domElement.removeEventListener('mousemove', this.onDocumentMouseMove, false);
            this.renderer.domElement.removeEventListener('mousewheel', this.onDocumentMouseWheel, false);
            document.removeEventListener("keydown", this.onDocumentKey, false);
            document.removeEventListener("keyup", this.onDocumentKey, false);
            this.menuPanel.style.display = 'block';
            this.recentWinnersTable.style.display = 'none';
            this.gameClosedAlert.style.display = 'none';
            this.newGameAlert.style.display = 'none'
            this.menuActive = true
        }
    }

    public onDocumentKey = (e) => {
        this.keyMap[e.keyCode] = e.type == 'keydown';
        const tmpVec = [0, 0]
        if (this.keyMap[87]) { //w
            tmpVec[0] += Math.cos(this.cameraRotationXZOffset)
            tmpVec[1] -= Math.sin(this.cameraRotationXZOffset)
        }
        if (this.keyMap[83]) {//s
            tmpVec[0] -= Math.cos(this.cameraRotationXZOffset)
            tmpVec[1] += Math.sin(this.cameraRotationXZOffset)
        }
        if (this.keyMap[65]) {//a
            tmpVec[0] += Math.sin(this.cameraRotationXZOffset)
            tmpVec[1] += Math.cos(this.cameraRotationXZOffset)
        }
        if (this.keyMap[68]) {//d
            tmpVec[0] -= Math.sin(this.cameraRotationXZOffset)
            tmpVec[1] -= Math.cos(this.cameraRotationXZOffset)
        }
        if (this.keyMap[32]) { //space
            this.spcKey = 1
        } else {
            this.spcKey = 0
        }
        this.vec = [tmpVec[0], tmpVec[1]]
    };


    public onDocumentMouseWheel = (e) => {
        this.radius -= e.wheelDeltaY * 0.005;
        this.radius = Math.max(Math.min(this.radius, 20), 2);
        return false;
    }
    public onDocumentMouseMove = (e) => {
        this.cameraRotationXZOffset += (e.movementX * this.sensitivity)
        this.cameraRotationYOffset += (e.movementY * this.sensitivity)
        this.cameraRotationYOffset = Math.max(Math.min(this.cameraRotationYOffset, 2.5), -2.5)
        return false;
    }

    public onXYControllerLook = (value: vec2) => {
        this.cameraRotationXZOffset -= (value.x) * .1
        this.cameraRotationYOffset += (value.y) * .1
        this.cameraRotationYOffset = Math.max(Math.min(this.cameraRotationYOffset, 2.5), -2.5)
    }

    public onXYControllerMove = (value: vec2) => {
        const tmpVec = [0, 0]
        if (value.y > 0) { //w
            tmpVec[0] += Math.cos(this.cameraRotationXZOffset) * .75
            tmpVec[1] -= Math.sin(this.cameraRotationXZOffset) * .75
        }
        if (value.y < 0) {//s
            tmpVec[0] -= Math.cos(this.cameraRotationXZOffset) * .75
            tmpVec[1] += Math.sin(this.cameraRotationXZOffset) * .75
        }
        if (value.x > 0) {//a
            tmpVec[0] += Math.sin(this.cameraRotationXZOffset) * .75
            tmpVec[1] += Math.cos(this.cameraRotationXZOffset) * .75
        }
        if (value.x < 0) {//d
            tmpVec[0] -= Math.sin(this.cameraRotationXZOffset) * .75
            tmpVec[1] -= Math.cos(this.cameraRotationXZOffset) * .75
        }
        this.vec = [tmpVec[0], tmpVec[1]]
    }
}