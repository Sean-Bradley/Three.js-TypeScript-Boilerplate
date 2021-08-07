"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const player_1 = __importDefault(require("./player"));
const physics_1 = __importDefault(require("./physics"));
const CANNON = __importStar(require("cannon-es"));
class TheBallGame {
    constructor(io) {
        this.gameClock = 1;
        this.gamePhase = 0; //0=closed, 1=open
        this.gameId = 0;
        this.gameWinner = '';
        this.resentWinners = [
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
        ];
        this.jewel = {};
        this.players = {};
        this.obstacles = {};
        this.playerCount = 0;
        this.physics = new physics_1.default(this, io);
        io.on('connection', (socket) => {
            this.players[socket.id] = new player_1.default();
            this.players[socket.id].canJump = true;
            this.players[socket.id].screenName = 'Guest' + this.playerCount++;
            //console.log(this.players)
            console.log('a user connected : ' + socket.id);
            socket.emit('joined', socket.id, this.players[socket.id].screenName, this.resentWinners);
            this.players[socket.id].bodyId = this.physics.createPlayerSphere(socket.id);
            socket.on('disconnect', () => {
                console.log('socket disconnected : ' + socket.id);
                if (this.players && this.players[socket.id]) {
                    console.log('deleting ' + socket.id);
                    delete this.players[socket.id];
                    this.physics.world.removeBody(this.physics.bodies[socket.id]);
                    delete this.physics.bodies[socket.id];
                    io.emit('removePlayer', socket.id);
                }
            });
            socket.on('update', (message) => {
                //console.log(message)
                if (this.players[socket.id]) {
                    this.players[socket.id].t = message.t; //client timestamp
                    const aVel = new CANNON.Vec3(message.vec[1], 0, message.vec[0]).scale(20);
                    this.physics.bodies[socket.id].angularVelocity.copy(aVel);
                    if (message.spc) {
                        if (this.players[socket.id].canJump) {
                            this.players[socket.id].canJump = false;
                            this.physics.bodies[socket.id].velocity.y += 10;
                        }
                    }
                }
            });
            socket.on('updateScreenName', (screenName) => {
                if (screenName.match(/^[0-9a-zA-Z]+$/) && screenName.length <= 12) {
                    this.players[socket.id].screenName = screenName;
                }
            });
        });
        setInterval(() => {
            io.emit('gameData', {
                gameId: this.gameId,
                gamePhase: this.gamePhase,
                gameClock: this.gameClock,
                players: this.players,
                obstacles: this.obstacles,
                jewel: this.jewel,
            });
        }, 50);
        setInterval(() => {
            this.physics.world.step(0.025);
            Object.keys(this.players).forEach((p) => {
                this.players[p].p = {
                    x: this.physics.bodies[p].position.x,
                    y: this.physics.bodies[p].position.y,
                    z: this.physics.bodies[p].position.z,
                };
                this.players[p].q = {
                    x: this.physics.bodies[p].quaternion.x,
                    y: this.physics.bodies[p].quaternion.y,
                    z: this.physics.bodies[p].quaternion.z,
                    w: this.physics.bodies[p].quaternion.w,
                };
            });
            Object.keys(this.obstacles).forEach((o, i) => {
                this.obstacles[o].p = {
                    x: this.physics.bodies['obstacle_' + i].position.x,
                    y: this.physics.bodies['obstacle_' + i].position.y,
                    z: this.physics.bodies['obstacle_' + i].position.z,
                };
                this.physics.bodies['obstacle_' + i].quaternion.normalize();
                this.obstacles[o].q = {
                    x: this.physics.bodies['obstacle_' + i].quaternion.x,
                    y: this.physics.bodies['obstacle_' + i].quaternion.y,
                    z: this.physics.bodies['obstacle_' + i].quaternion.z,
                    w: this.physics.bodies['obstacle_' + i].quaternion.w,
                };
            });
            this.jewel.p = {
                x: this.physics.bodies['jewel'].position.x,
                y: this.physics.bodies['jewel'].position.y,
                z: this.physics.bodies['jewel'].position.z,
            };
        }, 25);
        setInterval(() => {
            this.gameClock -= 1;
            if (this.gameClock < -5) {
                //generate new game
                this.physics.regenerateObstacles(this.obstacles);
                this.physics.jewelBody.wakeUp();
                this.gamePhase = 1;
                this.gameClock = 10;
                this.gameWinner = '';
                this.gameId += 1;
                io.emit('newGame', {});
            }
            else if (this.gameClock < 0) {
                this.gamePhase = 0;
                this.physics.jewelBody.position.x = Math.random() * 50 - 25;
                this.physics.jewelBody.position.y = Math.random() * 20 + 20;
                this.physics.jewelBody.position.z = Math.random() * 50 - 25;
                this.physics.jewelBody.velocity.set(0, 0, 0);
                this.physics.jewelBody.angularVelocity.set(0, 0, 0);
                this.physics.jewelBody.sleep();
            }
            //reset out of bounds players
            Object.keys(this.players).forEach((p) => {
                if (this.physics.bodies[p].position.y < -25) {
                    this.physics.bodies[p].position.x = Math.random() * 50 - 25;
                    this.physics.bodies[p].position.y = 10;
                    this.physics.bodies[p].position.z = Math.random() * 50 - 25;
                    this.physics.bodies[p].velocity.set(0, 0, 0);
                    this.physics.bodies[p].angularVelocity.set(0, 0, 0);
                }
            });
        }, 1000);
    }
}
exports.default = TheBallGame;
