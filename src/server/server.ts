import express from "express"
import path from "path"
import http from "http"
import * as THREE from "THREE"
import socketIO from "socket.io"
import Jimp from "jimp"
const jsdom = require('jsdom').jsdom

global.document = jsdom();
global.THREE = THREE

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
    private gl = require('gl')(this.width, this.height, { preserveDrawingBuffer: true }); //headless-gl
    private renderer = new THREE.WebGLRenderer({ context: this.gl });
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

        const J = new Jimp(this.width, this.height, (err, image: any) => {})
        
        setInterval(() => {
            this.delta = this.clock.getDelta()
            this.cube.rotation.x += 0.1 * this.delta
            this.cube.rotation.y += 0.1 * this.delta

            this.renderer.render(this.scene, this.camera);

            var bitmapData = new Uint8Array(this.width * this.height * 4)
            this.gl.readPixels(0, 0, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, bitmapData)

            new Jimp(this.width, this.height, (err, image: any) => {
                if (!err) {
                    image.bitmap.data = bitmapData

                    image.getBuffer("image/png", (err: object, buffer: Uint8Array) => {
                        if (!err) {
                            this.io.emit('image', Buffer.from(buffer));
                        }
                    });
                }
            })
        }, 50)
    }

    public Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`)
        })
    }
}

new App(port).Start()