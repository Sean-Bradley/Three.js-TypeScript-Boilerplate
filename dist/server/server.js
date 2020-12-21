"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const THREE = __importStar(require("THREE"));
var Jimp = require("jimp");
const MockBrowser = require('mock-browser').mocks.MockBrowser;
global.document = MockBrowser.createDocument();
global.THREE = THREE;
const gl = require('gl')(400, 400, { preserveDrawingBuffer: true }); //headless-gl
const port = 3000;
class App {
    constructor(port) {
        this.clients = {};
        this.width = 400;
        this.height = 400;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
        //private renderTarget = new THREE.WebGLRenderTarget(this.width, this.height);
        this.renderer = new THREE.WebGLRenderer({ context: gl });
        this.clock = new THREE.Clock();
        this.delta = 0;
        this.port = port;
        const app = express_1.default();
        app.use(express_1.default.static(path_1.default.join(__dirname, '../client')));
        //pp.use('/build/three.module.js', express.static(path.join(__dirname, '../../node_modules/three/build/three.module.js')))
        //app.use('/jsm/controls/OrbitControls', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/controls/OrbitControls.js')))
        this.server = new http_1.default.Server(app);
        // this.io = socketIO(this.server);
        // this.io.on('connection', (socket: socketIO.Socket) => {
        //     this.clients[socket.id] = {}
        //     console.log(this.clients)
        //     console.log('a user connected : ' + socket.id)
        //     socket.emit("id", socket.id);
        //     socket.on('disconnect', () => {
        //         console.log('socket disconnected : ' + socket.id)
        //         if (this.clients && this.clients[socket.id]) {
        //             console.log("deleting " + socket.id)
        //             delete this.clients[socket.id]
        //             this.io.emit("removeClient", socket.id)
        //         }
        //     })
        // })
        this.renderer.setSize(this.width, this.height);
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);
        this.camera.position.z = 2;
        app.get('/render', (req, res) => {
            this.renderer.render(this.scene, this.camera);
            var bitmapData = new Uint8Array(this.width * this.height * 4);
            gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, bitmapData);
            new Jimp(this.width, this.height, function (err, image) {
                image.bitmap.data = bitmapData;
                image.getBuffer("image/png", (err, buffer) => {
                    res.end(Buffer.from(buffer));
                });
            });
        });
        setInterval(() => {
            this.delta = this.clock.getDelta();
            this.cube.rotation.x += 0.1 * this.delta;
            this.cube.rotation.y += 0.1 * this.delta;
            // // 
            // gl.clearColor(1, 0, 0, 1)
            // gl.clear(gl.COLOR_BUFFER_BIT)
            // gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels)
            // this.io.emit('image', { image: true, buffer: this.pixels.toString('base64') });
            // //this.io.emit("imageConversionByClient", { image: true, buffer: this.pixels });
        }, 10);
    }
    Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`);
        });
    }
}
new App(port).Start();
//# sourceMappingURL=server.js.map