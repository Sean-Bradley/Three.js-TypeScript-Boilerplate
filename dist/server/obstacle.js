"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Obstacle {
    constructor() {
        this.p = { x: 0, y: 0, z: 0 }; //position
        this.q = { x: 0, y: 0, z: 0, w: 0 }; //quaternion
        this.s = { x: 0, y: 0, z: 0 }; //size
    }
}
exports.default = Obstacle;
