import express from "express"
import path from "path"
import http from "http"
import * as THREE from "THREE"
import socketIO from "socket.io"
var Jimp = require("jimp")
import { JSDOM } from 'jsdom'

const { window } = new JSDOM();
global.document = window.document;

const gl = require('gl')(400, 400, { preserveDrawingBuffer: true }); //headless-gl

const port: number = 3000


class App {
    private server: http.Server
    private port: number
    private io: socketIO.Server
    private clients: any = {}
    private width = 400
    private height = 400
    private scene = new THREE.Scene()
    private camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000)
    private renderer = new THREE.WebGLRenderer({ context: gl });
    private cube: THREE.Mesh
    private clock: THREE.Clock = new THREE.Clock()
    private delta = 0;
    constructor(port: number) {
        this.port = port

        const app = express()
        app.use(express.static(path.join(__dirname, '../client')))
        //app.use('/build/three.module.js', express.static(path.join(__dirname, '../../node_modules/three/build/three.module.js')))
        //app.use('/jsm/controls/OrbitControls', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/controls/OrbitControls.js')))

        this.server = new http.Server(app);

        this.io = socketIO(this.server);

        this.io.on('connection', (socket: socketIO.Socket) => {
            this.clients[socket.id] = {}
            console.log(this.clients)
            console.log('a user connected : ' + socket.id)
            socket.emit("id", socket.id);

            socket.on('disconnect', () => {
                console.log('socket disconnected : ' + socket.id)
                if (this.clients && this.clients[socket.id]) {
                    console.log("deleting " + socket.id)
                    delete this.clients[socket.id]
                    this.io.emit("removeClient", socket.id)
                }
            })
        })

        this.renderer.setSize(this.width, this.height)

        const geometry: THREE.BoxGeometry = new THREE.BoxGeometry()
        const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })

        this.cube = new THREE.Mesh(geometry, material)
        this.scene.add(this.cube)

        this.camera.position.z = 2

        setInterval(() => {
            this.delta = this.clock.getDelta()

            this.cube.rotation.x += 0.1 * this.delta
            this.cube.rotation.y += 0.1 * this.delta

            if (Object.keys(this.clients).length > 0) {
                this.renderer.render(this.scene, this.camera);

                var bitmapData = new Uint8Array(this.width * this.height * 4)
                gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, bitmapData)

                new Jimp(this.width, this.height, (err, image) => {

                    image.bitmap.data = bitmapData

                    image.getBuffer("image/png", (err, buffer) => {
                        this.io.emit('image', Buffer.from(buffer));
                    });
                })
            }
        }, 50)

    }

    public Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`)
        })
    }
}

new App(port).Start()
