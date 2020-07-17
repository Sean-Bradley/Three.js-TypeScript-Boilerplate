import express from "express"
import path from "path"
import http from "http"
import socketIO from "socket.io"
import theBallGame from "./theBallGame"

const port: number = 3000

class App {
    private server: http.Server
    private port: number

    private io: socketIO.Server
    
        
    constructor(port: number) {
        this.port = port
        const app = express()
        app.use(express.static(path.join(__dirname, '../client')))
        app.use('/build/three.module.js', express.static(path.join(__dirname, '../../node_modules/three/build/three.module.js')))
        app.use('/jsm/libs/stats.module', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/libs/stats.module.js')))
        app.use('/jsm/libs/tween.module.min', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/libs/tween.module.min.js')))
        app.use('/jsm/objects/Reflector', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/objects/Reflector.js')))
        app.use('/jsm/loaders/OBJLoader', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/loaders/OBJLoader.js')))
        this.server = new http.Server(app);

        this.io = socketIO(this.server);

        new theBallGame(this.io)
    }

    public Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`)
        })
    }
}

new App(port).Start()