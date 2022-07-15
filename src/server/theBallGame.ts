import Player from './player'
import Obstacle from './obstacle'
import Physics from './physics'
import * as CANNON from 'cannon-es'

export default class TheBallGame {
    public gameClock = 1
    public gamePhase = 0 //0=closed, 1=open
    public gameId: number = 0
    public gameWinner: string = ''
    public resentWinners: any[] = [
        { screenName: 'SeanWasEre', time: 1 },
        { screenName: 'SeanWasEre', time: 2 },
        { screenName: 'SeanWasEre', time: 3 },
        { screenName: 'SeanWasEre', time: 4 },
        { screenName: 'SeanWasEre', time: 5 },
        { screenName: 'SeanWasEre', time: 6 },
        { screenName: 'SeanWasEre', time: 7 },
        { screenName: 'SeanWasEre', time: 8 },
        { screenName: 'SeanWasEre', time: 9 },
        { screenName: 'SeanWasEre', time: 10 },
    ]

    public jewel: any = {}

    public players: { [id: string]: Player } = {}
    public obstacles: { [id: string]: Obstacle } = {}

    public physics: Physics

    private playerCount = 0

    constructor(io: any) {
        this.physics = new Physics(this, io)

        io.on('connection', (socket: any) => {
            this.players[socket.id] = new Player()
            this.players[socket.id].canJump = true
            this.players[socket.id].screenName = 'Guest' + this.playerCount++

            //console.log(this.players)
            console.log('a user connected : ' + socket.id)
            socket.emit(
                'joined',
                socket.id,
                this.players[socket.id].screenName,
                this.resentWinners
            )

            this.players[socket.id].bodyId = this.physics.createPlayerSphere(
                socket.id
            )

            socket.on('disconnect', () => {
                console.log('socket disconnected : ' + socket.id)
                if (this.players && this.players[socket.id]) {
                    console.log('deleting ' + socket.id)
                    delete this.players[socket.id]
                    this.physics.world.removeBody(this.physics.bodies[socket.id])
                    delete this.physics.bodies[socket.id]
                    io.emit('removePlayer', socket.id)
                }
            })

            socket.on('update', (message: any) => {
                //console.log(message)
                if (this.players[socket.id]) {
                    this.players[socket.id].t = message.t //client timestamp
                    const aVel = new CANNON.Vec3(
                        message.vec[1],
                        0,
                        message.vec[0]
                    ).scale(20)
                    this.physics.bodies[socket.id].angularVelocity.copy(aVel)
                    if (message.spc) {
                        if (this.players[socket.id].canJump) {
                            this.players[socket.id].canJump = false
                            this.physics.bodies[socket.id].velocity.y += 10
                        }
                    }
                }
            })

            socket.on('updateScreenName', (screenName: string) => {
                if (screenName.match(/^[0-9a-zA-Z]+$/) && screenName.length <= 12) {
                    this.players[socket.id].screenName = screenName
                }
            })
        })

        setInterval(() => {            
            io.emit('gameData', {
                gameId: this.gameId,
                gamePhase: this.gamePhase,
                gameClock: this.gameClock,
                players: this.players,
                obstacles: this.obstacles,
                jewel: this.jewel,
            })
        }, 50)

        setInterval(() => {
            this.physics.world.step(0.025)

            Object.keys(this.players).forEach((p) => {
                this.players[p].p = {
                    x: this.physics.bodies[p].position.x,
                    y: this.physics.bodies[p].position.y,
                    z: this.physics.bodies[p].position.z,
                }
                this.players[p].q = {
                    x: this.physics.bodies[p].quaternion.x,
                    y: this.physics.bodies[p].quaternion.y,
                    z: this.physics.bodies[p].quaternion.z,
                    w: this.physics.bodies[p].quaternion.w,
                }
            })
            Object.keys(this.obstacles).forEach((o, i) => {
                this.obstacles[o].p = {
                    x: this.physics.bodies['obstacle_' + i].position.x,
                    y: this.physics.bodies['obstacle_' + i].position.y,
                    z: this.physics.bodies['obstacle_' + i].position.z,
                }
                this.physics.bodies['obstacle_' + i].quaternion.normalize()
                this.obstacles[o].q = {
                    x: this.physics.bodies['obstacle_' + i].quaternion.x,
                    y: this.physics.bodies['obstacle_' + i].quaternion.y,
                    z: this.physics.bodies['obstacle_' + i].quaternion.z,
                    w: this.physics.bodies['obstacle_' + i].quaternion.w,
                }
            })
            this.jewel.p = {
                x: this.physics.bodies['jewel'].position.x,
                y: this.physics.bodies['jewel'].position.y,
                z: this.physics.bodies['jewel'].position.z,
            }
        }, 25)

        setInterval(() => {
            this.gameClock -= 1
            if (this.gameClock < -5) {
                //generate new game
                this.physics.regenerateObstacles(this.obstacles)
                this.physics.jewelBody.wakeUp()
                this.gamePhase = 1
                this.gameClock = 10
                this.gameWinner = ''
                this.gameId += 1
                io.emit('newGame', {})
            } else if (this.gameClock < 0) {
                this.gamePhase = 0
                this.physics.jewelBody.position.x = Math.random() * 50 - 25
                this.physics.jewelBody.position.y = Math.random() * 20 + 20
                this.physics.jewelBody.position.z = Math.random() * 50 - 25
                this.physics.jewelBody.velocity.set(0, 0, 0)
                this.physics.jewelBody.angularVelocity.set(0, 0, 0)
                this.physics.jewelBody.sleep()
            }

            //reset out of bounds players
            Object.keys(this.players).forEach((p) => {
                if (this.physics.bodies[p].position.y < -25) {
                    this.physics.bodies[p].position.x = Math.random() * 50 - 25
                    this.physics.bodies[p].position.y = 10
                    this.physics.bodies[p].position.z = Math.random() * 50 - 25
                    this.physics.bodies[p].velocity.set(0, 0, 0)
                    this.physics.bodies[p].angularVelocity.set(0, 0, 0)
                }
            })
        }, 1000)
    }
}
