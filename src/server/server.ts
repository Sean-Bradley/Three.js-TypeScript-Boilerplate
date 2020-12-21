import express from "express"
import path from "path"
import http from "http"
import * as THREE from "THREE"
import socketIO from "socket.io"
const Jimp = require("jimp")
import { JSDOM } from "jsdom"
import { OBJLoader } from "./OBJLoader.js"
const fs = require('fs');

const { window } = new JSDOM();
global.document = window.document;

const port: number = 3000

class App {
    private server: http.Server
    private port: number
    private io: socketIO.Server
    private clients: any = {}
    private width = 600
    private height = 400
    private scene = new THREE.Scene()
    private camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000)
    private gl = require('gl')(this.width, this.height, { preserveDrawingBuffer: true }); //headless-gl
    private renderer = new THREE.WebGLRenderer({ context: this.gl });
    private mesh = new THREE.Mesh()
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

        var light1 = new THREE.PointLight();
        light1.position.set(2.5, 2.5, 2.5)
        this.scene.add(light1);

        var light2 = new THREE.PointLight();
        light2.position.set(-2.5, 2.5, 2.5)
        this.scene.add(light2);

        const material = new THREE.MeshPhysicalMaterial({
            color: 0xb2ffc8,
            metalness: 0.5,
            roughness: 0.1,
            transparent: true,
            transmission: 1.0,
            side: THREE.DoubleSide,
            clearcoat: 1.0,
            clearcoatRoughness: .25
        });

        const loader = new OBJLoader()
        const data = fs.readFileSync(path.resolve(__dirname, "models/monkey.obj"), { encoding: 'utf8', flag: 'r' });

        const obj = loader.parse(data)
        obj.traverse((child: THREE.Mesh) => {
            if (child.type === "Mesh") {
                child.material = material
                this.mesh = new THREE.Mesh(child.geometry, material)                
            }
        })
        this.mesh = obj
        this.scene.add(this.mesh)

        this.camera.position.z = 2

        setInterval(() => {
            this.delta = this.clock.getDelta()

            if (this.mesh) {
                this.mesh.rotation.x += 0.1 * this.delta
                this.mesh.rotation.y += 0.1 * this.delta
            }

            if (Object.keys(this.clients).length > 0) {
                this.renderer.render(this.scene, this.camera);

                var bitmapData = new Uint8Array(this.width * this.height * 4)
                this.gl.readPixels(0, 0, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, bitmapData)

                new Jimp(this.width, this.height, (err: object, image: any) => {

                    image.bitmap.data = bitmapData

                    image.getBuffer("image/png", (err: object, buffer: Uint8Array) => {
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
