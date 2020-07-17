export default class Player {

    public bodyId = -1
    public screenName = ""
    public canJump = true

    public p = { x: 0, y: 0, z: 0 } //position
    public q = { x: 0, y: 0, z: 0, w: 0 }   //quaternion

    public t = -1 //ping timestamp

    constructor() {

    }
}