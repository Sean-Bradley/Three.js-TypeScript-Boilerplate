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
const THREE = __importStar(require("three"));
const socket_io_1 = __importDefault(require("socket.io"));
const jimp_1 = __importDefault(require("jimp"));
const jsdom_1 = require("jsdom");
const OBJLoader_js_1 = require("./OBJLoader.js");
const fs_1 = __importDefault(require("fs"));
const { window } = new jsdom_1.JSDOM();
global.document = window.document;
const port = 3000;
class App {
    constructor(port) {
        this.clients = {};
        this.width = 600;
        this.height = 400;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
        this.gl = require('gl')(this.width, this.height, { preserveDrawingBuffer: true }); //headless-gl
        this.renderer = new THREE.WebGLRenderer({ context: this.gl });
        this.mesh = new THREE.Mesh();
        this.clock = new THREE.Clock();
        this.delta = 0;
        this.port = port;
        const app = express_1.default();
        app.use(express_1.default.static(path_1.default.join(__dirname, '../client')));
        this.server = new http_1.default.Server(app);
        this.io = socket_io_1.default(this.server);
        this.io.on('connection', (socket) => {
            this.clients[socket.id] = {};
            console.log(this.clients);
            console.log('a user connected : ' + socket.id);
            socket.emit("id", socket.id);
            socket.on('disconnect', () => {
                console.log('socket disconnected : ' + socket.id);
                if (this.clients && this.clients[socket.id]) {
                    console.log("deleting " + socket.id);
                    delete this.clients[socket.id];
                    this.io.emit("removeClient", socket.id);
                }
            });
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        var light1 = new THREE.PointLight();
        light1.position.set(50, 50, 50);
        this.scene.add(light1);
        var light2 = new THREE.PointLight();
        light2.position.set(-50, 50, 50);
        this.scene.add(light2);
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x66ffff,
            metalness: 0.5,
            roughness: 0.1,
            transparent: true,
            transmission: 1.0,
            side: THREE.DoubleSide,
            clearcoat: 1.0,
            clearcoatRoughness: .25
        });
        const loader = new OBJLoader_js_1.OBJLoader();
        const data = fs_1.default.readFileSync(path_1.default.resolve(__dirname, "models/seanwasere.obj"), { encoding: 'utf8', flag: 'r' });
        const obj = loader.parse(data);
        obj.traverse((child) => {
            if (child.type === "Mesh") {
                child.material = material;
                this.mesh = new THREE.Mesh(child.geometry, material);
            }
        });
        this.mesh = obj;
        this.mesh.rotateZ(Math.PI);
        this.scene.add(this.mesh);
        this.camera.position.z = 30;
        setInterval(() => {
            this.delta = this.clock.getDelta();
            if (this.mesh) {
                this.mesh.rotation.y += 0.5 * this.delta;
                this.mesh.rotation.z += 0.25 * this.delta;
            }
            if (Object.keys(this.clients).length > 0) {
                this.renderer.render(this.scene, this.camera);
                var bitmapData = new Uint8Array(this.width * this.height * 4);
                this.gl.readPixels(0, 0, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, bitmapData);
                new jimp_1.default(this.width, this.height, (err, image) => {
                    image.bitmap.data = bitmapData;
                    jimp_1.default.loadFont(jimp_1.default.FONT_SANS_32_WHITE).then(font => {
                        image.fillStyle = "red";
                        image.print(font, 100, 340, new Date().toISOString());
                    }).then(() => {
                        image.getBuffer("image/png", (err, buffer) => {
                            this.io.emit('image', Buffer.from(buffer));
                        });
                    });
                });
            }
        }, 100);
    }
    Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`);
        });
    }
}
new App(port).Start();
//# sourceMappingURL=server.js.map