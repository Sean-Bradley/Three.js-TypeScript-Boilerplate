import express from "express"
import path from "path"
import http from "http"

const port: number = 3000

class App {
    private server: http.Server
    private port: number

    constructor(port: number) {
        this.port = port
        const app = express()
        app.use(express.static(path.join(__dirname, '../client')))
        app.use('/build/three.module.js', express.static(path.join(__dirname, '../../node_modules/three/build/three.module.js')))
        app.use('/jsm/webxr/VRButton', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/webxr/VRButton.js')))
        app.use('/statsvr', express.static(path.join(__dirname, '../../node_modules/statsvr/dist/client/statsvr.js')))
        app.use('/teleportvr', express.static(path.join(__dirname, '../../node_modules/teleportvr/dist/client/teleportvr.js')))        
        app.use('/grabvr', express.static(path.join(__dirname, '../../node_modules/grabvr/dist/client/grabvr.js')))
        app.use('/cannon/cannon.min', express.static(path.join(__dirname, '../../node_modules/cannon/build/cannon.min.js')))
        
        this.server = new http.Server(app);
    }

    public Start() {
        this.server.listen(this.port, () => {
            console.log( `Server listening on port ${this.port}.` )
        })
    }
}

new App(port).Start()