"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const theBallGame_1 = __importDefault(require("./theBallGame"));
const port = 3000;
class App {
    constructor(port) {
        this.port = port;
        const app = express_1.default();
        app.use(express_1.default.static(path_1.default.join(__dirname, '../client')));
        app.use('/build/three.module.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/build/three.module.js')));
        app.use('/jsm/libs/stats.module', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/libs/stats.module.js')));
        app.use('/jsm/libs/tween.module.min', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/libs/tween.module.min.js')));
        app.use('/jsm/objects/Reflector', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/objects/Reflector.js')));
        app.use('/jsm/loaders/OBJLoader', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/loaders/OBJLoader.js')));
        this.server = new http_1.default.Server(app);
        this.io = new socket_io_1.Server(this.server);
        new theBallGame_1.default(this.io);
    }
    Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`);
        });
    }
}
new App(port).Start();
