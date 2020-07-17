"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cannon_1 = __importDefault(require("cannon"));
class Physics {
    constructor(theBallGame, io) {
        this.world = new cannon_1.default.World();
        this.bodies = {};
        this.jewelBody = new cannon_1.default.Body;
        this.theBallGame = theBallGame;
        this.world.gravity.set(0, -9.82, 0);
        this.groundMaterial = new cannon_1.default.Material("groundMaterial");
        this.groundMaterial.friction = .15;
        this.groundMaterial.restitution = .25;
        this.slipperyMaterial = new cannon_1.default.Material("slipperyMaterial");
        this.slipperyMaterial.friction = .15;
        this.slipperyMaterial.restitution = .25;
        const groundShape = new cannon_1.default.Box(new cannon_1.default.Vec3(25, 1, 25));
        const groundBody = new cannon_1.default.Body({ mass: 0, material: this.groundMaterial });
        groundBody.addShape(groundShape);
        groundBody.position.x = 0;
        groundBody.position.y = -1;
        groundBody.position.z = 0;
        this.world.addBody(groundBody);
        const jewelShape = new cannon_1.default.Sphere(1);
        this.jewelBody = new cannon_1.default.Body({ mass: 1, material: this.slipperyMaterial });
        this.jewelBody.addShape(jewelShape);
        this.jewelBody.position.x = (Math.random() * 50) - 25;
        this.jewelBody.position.y = 20;
        this.jewelBody.position.z = (Math.random() * 50) - 25;
        this.jewelBody.addEventListener("collide", (e) => {
            if (theBallGame.gameWinner === "" && theBallGame.gameClock > 0) {
                Object.keys(theBallGame.players).forEach(p => {
                    if (theBallGame.players[p].bodyId === e.contact.bj.id) {
                        theBallGame.gameWinner = p;
                        theBallGame.resentWinners.push({ screenName: theBallGame.players[p].screenName, time: theBallGame.gameClock });
                        while (theBallGame.resentWinners.length > 10) {
                            theBallGame.resentWinners.shift();
                        }
                        theBallGame.gameClock = 0;
                        console.log("Game Winner = " + p);
                        this.jewelBody.sleep();
                        this.jewelBody.position.y = -1; //send it out of bounds
                        io.emit("winner", this.bodies[p].position, theBallGame.players[p].screenName, theBallGame.resentWinners);
                    }
                });
            }
        });
        this.world.addBody(this.jewelBody);
        this.bodies["jewel"] = this.jewelBody;
    }
    createPlayerSphere(id) {
        const sphereShape = new cannon_1.default.Sphere(1);
        const sphereBody = new cannon_1.default.Body({ mass: 1, material: this.slipperyMaterial, angularDamping: .9 });
        sphereBody.addShape(sphereShape);
        sphereBody.addEventListener("collide", (e) => {
            if (e.contact.ni.dot(new cannon_1.default.Vec3(0, 1, 0)) < -0.5) {
                this.theBallGame.players[id].canJump = true;
            }
        });
        sphereBody.position.x = (Math.random() * 50) - 25;
        sphereBody.position.y = 2;
        sphereBody.position.z = (Math.random() * 50) - 25;
        this.world.addBody(sphereBody);
        this.bodies[id] = sphereBody;
        return sphereBody.id;
    }
}
exports.default = Physics;
