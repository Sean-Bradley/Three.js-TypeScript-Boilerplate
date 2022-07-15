"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
const CANNON = __importStar(require("cannon-es"));
const obstacle_1 = __importDefault(require("./obstacle"));
class Physics {
    constructor(theBallGame, io) {
        this.world = new CANNON.World();
        this.bodies = {};
        this.jewelBody = new CANNON.Body();
        this.theBallGame = theBallGame;
        this.world.gravity.set(0, -9.82, 0);
        this.groundMaterial = new CANNON.Material('groundMaterial');
        this.groundMaterial.friction = 0.25;
        this.groundMaterial.restitution = 0.25;
        this.slipperyMaterial = new CANNON.Material('slipperyMaterial');
        this.slipperyMaterial.friction = 0.25;
        this.slipperyMaterial.restitution = 0.25;
        const groundShape = new CANNON.Box(new CANNON.Vec3(25, 1, 25));
        const groundBody = new CANNON.Body({
            mass: 0,
            material: this.groundMaterial,
        });
        groundBody.addShape(groundShape);
        groundBody.position.x = 0;
        groundBody.position.y = -1;
        groundBody.position.z = 0;
        this.world.addBody(groundBody);
        const jewelShape = new CANNON.Sphere(1);
        this.jewelBody = new CANNON.Body({
            mass: 1,
            material: this.slipperyMaterial,
        });
        this.jewelBody.addShape(jewelShape);
        this.jewelBody.position.x = Math.random() * 50 - 25;
        this.jewelBody.position.y = 20;
        this.jewelBody.position.z = Math.random() * 50 - 25;
        this.jewelBody.addEventListener('collide', (e) => {
            if (theBallGame.gameWinner === '' && theBallGame.gameClock > -1) {
                Object.keys(theBallGame.players).forEach((p) => {
                    if (theBallGame.players[p].bodyId === e.contact.bj.id) {
                        theBallGame.gameWinner = p;
                        theBallGame.resentWinners.push({
                            screenName: theBallGame.players[p].screenName,
                            time: theBallGame.gameClock,
                        });
                        while (theBallGame.resentWinners.length > 10) {
                            theBallGame.resentWinners.shift();
                        }
                        theBallGame.gameClock = 0;
                        console.log('Game Winner = ' + p);
                        this.jewelBody.sleep();
                        this.jewelBody.position.y = -1; //send it out of bounds
                        io.emit('winner', this.bodies[p].position, theBallGame.players[p].screenName, theBallGame.resentWinners);
                    }
                });
            }
        });
        this.world.addBody(this.jewelBody);
        this.bodies['jewel'] = this.jewelBody;
    }
    createPlayerSphere(id) {
        const sphereShape = new CANNON.Sphere(1);
        const sphereBody = new CANNON.Body({
            mass: 1,
            material: this.slipperyMaterial,
        }); //, angularDamping: .9 })
        sphereBody.addShape(sphereShape);
        sphereBody.addEventListener('collide', (e) => {
            if (e.contact.ni.dot(new CANNON.Vec3(0, 1, 0)) < -0.5) {
                this.theBallGame.players[id].canJump = true;
            }
        });
        sphereBody.position.x = Math.random() * 50 - 25;
        sphereBody.position.y = 2;
        sphereBody.position.z = Math.random() * 50 - 25;
        this.world.addBody(sphereBody);
        this.bodies[id] = sphereBody;
        return sphereBody.id;
    }
    regenerateObstacles(obstacles) {
        for (let i = 0; i < 10; i++) {
            const size = {
                x: Math.random() * 4 + 1,
                y: Math.random() * 4 + 1,
                z: Math.random() * 4 + 1,
            };
            const cubeShape = new CANNON.Box(new CANNON.Vec3(size.x, size.y, size.z));
            const cubeBody = new CANNON.Body({ mass: 1 });
            cubeBody.addShape(cubeShape);
            cubeBody.position.x = Math.random() * 50 - 25;
            cubeBody.position.y = Math.random() * 20 + 10;
            cubeBody.position.z = Math.random() * 50 - 25;
            obstacles[i] = new obstacle_1.default();
            obstacles[i].s = { x: size.x, y: size.y, z: size.z };
            if (this.bodies['obstacle_' + i]) {
                this.world.removeBody(this.bodies['obstacle_' + i]); //remove old
            }
            this.world.addBody(cubeBody); // add new
            this.bodies['obstacle_' + i] = cubeBody;
        }
    }
}
exports.default = Physics;
