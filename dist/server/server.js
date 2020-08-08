"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const port = 3000;
class App {
    constructor(port) {
        this.port = port;
        const app = express_1.default();
        app.use(express_1.default.static(path_1.default.join(__dirname, '../client')));
        app.use('/build/three.module.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/build/three.module.js')));
        app.use('/jsm/controls/OrbitControls', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/controls/OrbitControls.js')));
        app.use('/jsm/loaders/MTLLoader', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/loaders/MTLLoader.js')));
        app.use('/jsm/loaders/OBJLoader', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/loaders/OBJLoader.js')));
        app.use('/jsm/libs/stats.module', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/libs/stats.module.js')));
        app.use('/jsm/libs/tween.module.min', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/libs/tween.module.min.js')));
        app.use('/jsm/renderers/CSS2DRenderer', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/renderers/CSS2DRenderer.js')));
        this.server = new http_1.default.Server(app);
    }
    Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`);
        });
    }
}
new App(port).Start();
