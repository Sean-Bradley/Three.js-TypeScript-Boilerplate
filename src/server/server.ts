// When starting this project by using `npm run dev`, this server script
// will be compiled using tsc and will be running concurrently along side webpack-dev-server
// visit http://127.0.0.1:8080

// In the production environment we don't use the webpack-dev-server, so instead type,
// `npm run build`        (this creates the production version of bundle.js and places it in ./dist/client/)
// `tsc -p ./src/server`  (this compiles ./src/server/server.ts into ./dist/server/server.js)
// `npm start            (this starts nodejs with express and serves the ./dist/client folder)
// visit http://127.0.0.1:3000

import express from "express"
import path from "path"
import http from "http"
import { Server } from "socket.io"

const port: number = 3000

class App {
    private server: http.Server
    private port: number

    private io: Server
    private clients: any = {}

    constructor(port: number) {
        this.port = port
        const app = express()
        app.use(express.static(path.join(__dirname, '../client')))

        this.server = new http.Server(app);

        this.io = new Server(this.server);

        this.io.on('connection', (socket: SocketIO.Socket) => {
            console.log(socket.constructor.name)
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

            socket.on("update", (message: any) => {
                if (this.clients[socket.id]) {
                    this.clients[socket.id].t = message.t //client timestamp
                    this.clients[socket.id].p = message.p //position
                    this.clients[socket.id].r = message.r //rotation
                }
            });
        })

        setInterval(() => {
            this.io.emit("clients", this.clients)
        }, 50)
    }

    public Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`)
        })
    }
}

new App(port).Start()