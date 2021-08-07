// When starting this project by using `npm run dev`, this server script
// will be compiled using tsc and will be running concurrently along side webpack-dev-server
// visit http://127.0.0.1:8080

// In the production environment we don't use the webpack-dev-server, so instead type,
// `npm run build`        (this creates the production version of bundle.js and places it in ./dist/client/)
// `tsc -p ./src/server`  (this compiles ./src/server/server.ts into ./dist/server/server.js)
// `npm start            (this starts nodejs with express and serves the ./dist/client folder)
// visit http://127.0.0.1:3000

import express from 'express'
import path from 'path'
import http from 'http'
import socketIO from 'socket.io'
import theBallGame from './theBallGame'

const port: number = 3000

class App {
    private server: http.Server
    private port: number

    private io: socketIO.Server

    constructor(port: number) {
        this.port = port
        const app = express()
        app.use(express.static(path.join(__dirname, '../client')))
        app.use(
            '/build/three.module.js',
            express.static(
                path.join(
                    __dirname,
                    '../../node_modules/three/build/three.module.js'
                )
            )
        )
        app.use(
            '/jsm/libs/stats.module',
            express.static(
                path.join(
                    __dirname,
                    '../../node_modules/three/examples/jsm/libs/stats.module.js'
                )
            )
        )
        app.use(
            '/jsm/libs/tween.module.min',
            express.static(
                path.join(
                    __dirname,
                    '../../node_modules/three/examples/jsm/libs/tween.module.min.js'
                )
            )
        )
        app.use(
            '/jsm/objects/Reflector',
            express.static(
                path.join(
                    __dirname,
                    '../../node_modules/three/examples/jsm/objects/Reflector.js'
                )
            )
        )
        app.use(
            '/jsm/loaders/OBJLoader',
            express.static(
                path.join(
                    __dirname,
                    '../../node_modules/three/examples/jsm/loaders/OBJLoader.js'
                )
            )
        )
        this.server = new http.Server(app)

        this.io = new socketIO.Server(this.server)

        new theBallGame(this.io)
    }

    public Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`)
        })
    }
}

new App(port).Start()
