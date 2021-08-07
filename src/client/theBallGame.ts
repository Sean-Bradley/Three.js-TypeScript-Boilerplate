import Explosion from './explosion'
import * as THREE from 'three'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { Reflector } from 'three/examples/jsm/objects/Reflector'
import UI from './ui'
import { Socket } from 'socket.io-client'

export default class TheBallGame {
    public gamePhase: number = 0
    private timestamp = 0

    public players: { [id: string]: THREE.Mesh } = {}
    public obstacles: { [id: string]: THREE.Mesh } = {}

    private updateInterval: any

    public myId = ''

    public isMobile = false

    public ui: UI

    //UI Input
    public vec = [0, 0]
    public spcKey = 0

    //scene
    private scene: THREE.Scene
    private renderer: THREE.WebGLRenderer
    public camera: THREE.PerspectiveCamera
    public socket: Socket

    public cameraRotationXZOffset = 0
    public cameraRotationYOffset = 0
    public radius = 4
    public sensitivity = 0.004

    //private chaseCam: THREE.Object3D
    private ambientLight: THREE.AmbientLight
    private backGroundTexture: THREE.CubeTexture
    private jewel = new THREE.Object3D()
    private explosions: Explosion[]
    private sphereGeometry = new THREE.SphereBufferGeometry(1, 24, 24)
    private cubeGeometry = new THREE.BoxBufferGeometry(2, 2, 2)
    private sphereMaterial: THREE.MeshBasicMaterial
    private cubeMaterial: THREE.MeshBasicMaterial
    private cubeRenderTarget1: THREE.WebGLCubeRenderTarget
    private cubeCamera1: THREE.CubeCamera
    private myMaterial: THREE.MeshPhongMaterial
    private objLoader: OBJLoader
    private groundMirror: Reflector

    constructor(
        socket: Socket,
        scene: THREE.Scene,
        renderer: THREE.WebGLRenderer,
        camera: THREE.PerspectiveCamera
    ) {
        if (
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            )
        ) {
            this.isMobile = true
        }

        //threejs
        this.scene = scene
        this.renderer = renderer
        this.camera = camera
        this.socket = socket

        this.ui = new UI(this, renderer.domElement)

        this.ambientLight = new THREE.AmbientLight(0xffffff)
        scene.add(this.ambientLight)

        this.backGroundTexture = new THREE.CubeTextureLoader().load([
            'img/px_eso0932a.jpg',
            'img/nx_eso0932a.jpg',
            'img/py_eso0932a.jpg',
            'img/ny_eso0932a.jpg',
            'img/pz_eso0932a.jpg',
            'img/nz_eso0932a.jpg',
        ])
        scene.background = this.backGroundTexture

        this.explosions = [
            new Explosion(new THREE.Color(0xff0000), scene),
            new Explosion(new THREE.Color(0x00ff00), scene),
            new Explosion(new THREE.Color(0x0000ff), scene),
        ]

        this.sphereMaterial = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('img/marble.png'),
            envMap: scene.background,
            reflectivity: 0.66,
            combine: THREE.MixOperation,
        })
        this.cubeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            envMap: scene.background,
            combine: THREE.MixOperation,
            reflectivity: 0.99,
        })
        this.cubeRenderTarget1 = new THREE.WebGLCubeRenderTarget(128, {
            format: THREE.RGBFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter,
        })
        this.cubeCamera1 = new THREE.CubeCamera(0.1, 100, this.cubeRenderTarget1)
        this.myMaterial = new THREE.MeshPhongMaterial({
            map: new THREE.TextureLoader().load('img/marble.png'),
            reflectivity: 0.66,
            color: 0xffffff,
            flatShading: false,
            envMap: this.cubeRenderTarget1.texture,
        })
        scene.add(this.cubeCamera1)

        this.objLoader = new OBJLoader()
        this.objLoader.load(
            'models/jewel.obj',
            (object: THREE.Group) => {
                object.traverse(function (child) {
                    if ((child as THREE.Mesh).isMesh) {
                        ;(child as THREE.Mesh).material =
                            new THREE.MeshMatcapMaterial({
                                matcap: new THREE.TextureLoader().load(
                                    'img/jewel.png'
                                ),
                            })
                    }
                })
                this.jewel = object
                scene.add(this.jewel)
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            (error) => {
                console.log(error)
            }
        )

        this.groundMirror = new Reflector(new THREE.PlaneBufferGeometry(50, 50), {
            color: new THREE.Color(0x222222),
            clipBias: 0.003,
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
        })
        this.groundMirror.position.y = -0.05
        this.groundMirror.rotateX(-Math.PI / 2)
        scene.add(this.groundMirror)

        //sockets
        socket.on('connect', function () {
            console.log('connect')
        })
        socket.on('disconnect', (message: any) => {
            console.log('disconnect ' + message)
            clearInterval(this.updateInterval)
            Object.keys(this.players).forEach((p) => {
                scene.remove(this.players[p])
            })
        })
        socket.on('joined', (id: string, screenName: string, recentWinners: []) => {
            this.myId = id
            ;(
                document.getElementById('screenNameInput') as HTMLInputElement
            ).value = screenName

            this.updateInterval = setInterval(() => {
                socket.emit('update', {
                    t: Date.now(),
                    vec: this.vec,
                    spc: this.spcKey,
                }) //, p: myObject3D.position, r: myObject3D.rotation })
            }, 50)
            this.ui.updateScoreBoard(recentWinners)
        })

        socket.on(
            'winner',
            (position: THREE.Vector3, screenName: string, recentWinners: []) => {
                this.jewel.visible = false
                this.explosions.forEach((e) => {
                    e.explode(position)
                })
                ;(
                    document.getElementById('winnerLabel') as HTMLDivElement
                ).style.display = 'block'
                ;(
                    document.getElementById('winnerScreenName') as HTMLDivElement
                ).innerHTML = screenName
                this.ui.updateScoreBoard(recentWinners)
            }
        )

        socket.on('newGame', () => {
            if (this.jewel) {
                this.jewel.visible = true
            }
            this.ui.gameClosedAlert.style.display = 'none'
            if (!this.ui.menuActive) {
                this.ui.newGameAlert.style.display = 'block'
                setTimeout(() => {
                    this.ui.newGameAlert.style.display = 'none'
                }, 2000)
            }
        })

        socket.on('removePlayer', (id: string) => {
            scene.remove(scene.getObjectByName(id) as THREE.Object3D)
        })

        socket.on('gameData', (gameData: any) => {
            if (gameData.gameClock >= 0) {
                if (this.gamePhase != 1) {
                    console.log('new game')
                    this.gamePhase = 1
                    ;(
                        document.getElementById('gameClock') as HTMLDivElement
                    ).style.display = 'block'
                    if (this.jewel) {
                        this.jewel.visible = true
                    }
                    ;(
                        document.getElementById('winnerLabel') as HTMLDivElement
                    ).style.display = 'none'
                    ;(
                        document.getElementById(
                            'winnerScreenName'
                        ) as HTMLDivElement
                    ).innerHTML = ''
                }
                ;(
                    document.getElementById('gameClock') as HTMLDivElement
                ).innerText = Math.floor(gameData.gameClock).toString()
            } else {
                if (this.jewel) {
                    this.jewel.visible = false
                }
                ;(
                    document.getElementById('gameClock') as HTMLDivElement
                ).style.display = 'none'
                if (
                    !this.ui.menuActive &&
                    gameData.gameClock >= -3 &&
                    this.gamePhase === 1
                ) {
                    console.log('game closed')
                    this.ui.gameClosedAlert.style.display = 'block'
                    setTimeout(() => {
                        this.ui.gameClosedAlert.style.display = 'none'
                    }, 4000)
                }
                this.gamePhase = 0
            }
            let pingStatsHtml = 'Socket Ping Stats<br/><br/>'
            Object.keys(gameData.players).forEach((p) => {
                this.timestamp = Date.now()
                pingStatsHtml +=
                    gameData.players[p].screenName +
                    ' ' +
                    (this.timestamp - gameData.players[p].t) +
                    'ms<br/>'
                if (!this.players[p]) {
                    if (p === this.myId) {
                        this.players[p] = new THREE.Mesh(
                            this.sphereGeometry,
                            this.myMaterial
                        )
                    } else {
                        this.players[p] = new THREE.Mesh(
                            this.sphereGeometry,
                            this.sphereMaterial
                        )
                    }
                    this.players[p].name = p
                    this.players[p].position.set(
                        gameData.players[p].p.x,
                        gameData.players[p].p.y,
                        gameData.players[p].p.z
                    )
                    scene.add(this.players[p])
                } else {
                    if (gameData.players[p].p) {
                        if (p === this.myId) {
                            new TWEEN.Tween(this.players[p].position)
                                .to(
                                    {
                                        x: gameData.players[p].p.x,
                                        y: gameData.players[p].p.y,
                                        z: gameData.players[p].p.z,
                                    },
                                    50
                                )
                                .start()
                                .onUpdate(() => {
                                    this.camera.position.set(
                                        this.players[p].position.x +
                                            this.radius *
                                                Math.cos(
                                                    this.cameraRotationXZOffset
                                                ),
                                        this.players[p].position.y +
                                            this.radius *
                                                Math.atan(
                                                    this.cameraRotationYOffset
                                                ),
                                        this.players[p].position.z +
                                            this.radius *
                                                Math.sin(
                                                    this.cameraRotationXZOffset
                                                )
                                    )
                                    this.camera.lookAt(
                                        this.players[this.myId].position.x,
                                        this.players[this.myId].position.y + 1.5,
                                        this.players[this.myId].position.z
                                    )
                                })
                        } else {
                            new TWEEN.Tween(this.players[p].position)
                                .to(
                                    {
                                        x: gameData.players[p].p.x,
                                        y: gameData.players[p].p.y,
                                        z: gameData.players[p].p.z,
                                    },
                                    50
                                )
                                .start()
                        }
                    }
                    if (gameData.players[p].q) {
                        new TWEEN.Tween(this.players[p].quaternion)
                            .to(
                                {
                                    _x: gameData.players[p].q.x,
                                    _y: gameData.players[p].q.y,
                                    _z: gameData.players[p].q.z,
                                    _w: gameData.players[p].q.w,
                                },
                                50
                            )
                            .start()
                            .onUpdate(() => this.players[p].quaternion.normalize())
                    }
                }
            })
            Object.keys(gameData.obstacles).forEach((o) => {
                if (!this.obstacles[o]) {
                    if (gameData.obstacles[o].p) {
                        this.obstacles[o] = new THREE.Mesh(
                            this.cubeGeometry,
                            this.cubeMaterial
                        )
                        this.obstacles[o].name = o
                        this.obstacles[o].position.set(
                            gameData.obstacles[o].p.x,
                            gameData.obstacles[o].p.y,
                            gameData.obstacles[o].p.z
                        )
                        scene.add(this.obstacles[o])
                    }
                } else {
                    if (gameData.obstacles[o].p) {
                        new TWEEN.Tween(this.obstacles[o].position)
                            .to(
                                {
                                    x: gameData.obstacles[o].p.x,
                                    y: gameData.obstacles[o].p.y,
                                    z: gameData.obstacles[o].p.z,
                                },
                                50
                            )
                            .start()
                    }
                    if (gameData.obstacles[o].q) {
                        new TWEEN.Tween(this.obstacles[o].quaternion)
                            .to(
                                {
                                    x: gameData.obstacles[o].q.x,
                                    y: gameData.obstacles[o].q.y,
                                    z: gameData.obstacles[o].q.z,
                                    w: gameData.obstacles[o].q.w,
                                },
                                50
                            )
                            .start()
                    }
                    if (gameData.obstacles[o].s) {
                        new TWEEN.Tween(this.obstacles[o].scale)
                            .to(
                                {
                                    x: gameData.obstacles[o].s.x,
                                    y: gameData.obstacles[o].s.y,
                                    z: gameData.obstacles[o].s.z,
                                },
                                50
                            )
                            .start()
                    }
                }
            })
            if (this.jewel && gameData.jewel) {
                if (gameData.jewel.p) {
                    new TWEEN.Tween(this.jewel.position)
                        .to(
                            {
                                x: gameData.jewel.p.x,
                                y: gameData.jewel.p.y,
                                z: gameData.jewel.p.z,
                            },
                            50
                        )
                        .start()
                }
            }
            ;(document.getElementById('pingStats') as HTMLDivElement).innerHTML =
                pingStatsHtml
        })
    }

    public update = () => {
        if (this.jewel) {
            this.jewel.rotation.x += 0.01
            this.jewel.rotation.y += 0.025
        }

        this.explosions.forEach((e) => {
            e.update()
        })

        if (this.players[this.myId]) {
            this.groundMirror.visible = false
            this.players[this.myId].visible = false
            this.cubeCamera1.position.copy(this.players[this.myId].position)
            this.cubeCamera1.update(this.renderer, this.scene)
            this.groundMirror.visible = true
            this.players[this.myId].visible = true
        }

        TWEEN.update()
    }
}
