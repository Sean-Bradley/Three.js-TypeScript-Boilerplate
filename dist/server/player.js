"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Player {
    constructor() {
        this.bodyId = -1;
        this.screenName = "";
        this.canJump = true;
        this.p = { x: 0, y: 0, z: 0 }; //position
        this.q = { x: 0, y: 0, z: 0, w: 0 }; //quaternion
        this.t = -1; //ping timestamp
    }
}
exports.default = Player;
