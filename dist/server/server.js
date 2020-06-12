"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = __importDefault(require("socket.io"));
const port = 3000;
class App {
    constructor(port) {
        this.peers = {};
        this.port = port;
        const app = express_1.default();
        app.use(express_1.default.static(path_1.default.join(__dirname, '../client')));
        app.use('/build/three.module.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/build/three.module.js')));
        app.use('/jsm/controls/OrbitControls', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/controls/OrbitControls.js')));
        app.use('/jsm/libs/stats.module', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/libs/stats.module.js')));
        app.use('/jsm/libs/dat.gui.module', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/libs/dat.gui.module.js')));
        app.use('/jsm/libs/tween.module.min', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/libs/tween.module.min.js')));
        this.server = new http_1.default.Server(app);
        this.io = socket_io_1.default(this.server);
        this.io.on('connection', (socket) => {
            this.peers[socket.id] = {};
            console.log(this.peers);
            console.log('a user connected : ' + socket.id);
            socket.emit("id", socket.id);
            socket.on('disconnect', () => {
                console.log('socket disconnected : ' + socket.id);
                if (this.peers && this.peers[socket.id]) {
                    console.log("deleting " + socket.id);
                    delete this.peers[socket.id];
                    this.io.emit("removePeer", socket.id);
                }
            });
            socket.on("update", (message) => {
                if (this.peers[socket.id]) {
                    this.peers[socket.id].t = message.t; //client timestamp
                    this.peers[socket.id].p = message.p; //position
                    this.peers[socket.id].r = message.r; //rotation
                }
            });
        });
        setInterval(() => {
            this.io.emit("peers", this.peers);
        }, 50);
    }
    Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`);
        });
    }
}
new App(port).Start();
