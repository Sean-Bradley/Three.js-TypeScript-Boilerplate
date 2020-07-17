import * as THREE from '/build/three.module.js'

export default class Explosion {

    private particleCount = 100
    private particles: THREE.Points

    constructor(color: THREE.Color, scene: THREE.Scene) {
        const particleGeometry = new THREE.Geometry()
        for (let j = 0; j < this.particleCount; j++) {
            let vertex = new THREE.Vector3()
            particleGeometry.vertices.push(vertex)
        }
        var pMaterial = new THREE.PointsMaterial({
            color: color,
            size: 1
        });
        this.particles = new THREE.Points(particleGeometry, pMaterial);
        scene.add(this.particles)
        this.particles.visible = false
    }

    public explode(position: THREE.Vector3) {
        this.particles.position.x = position.x
        this.particles.position.y = position.y
        this.particles.position.z = position.z
        for (let j = 0; j < this.particleCount; j++) {
            let vertex = new THREE.Vector3(
                (Math.random() * 0.5) - 0.25,
                Math.random() * 0.25,
                (Math.random() * 0.5) - 0.25);
            (this.particles.geometry as THREE.Geometry).vertices[j] = vertex;
        }
        this.particles.userData.explosionPower = 1.2
        this.particles.visible = true
    }

    public update() {
        if (!this.particles.visible) return
        for (var j = 0; j < this.particleCount; j++) {
            (this.particles.geometry as THREE.Geometry).vertices[j].multiplyScalar(this.particles.userData.explosionPower);
        }
        if (this.particles.userData.explosionPower > 1.15) {
            this.particles.userData.explosionPower -= 0.001
        } else {
            this.particles.visible = false
        }
        (this.particles.geometry as THREE.Geometry).verticesNeedUpdate = true
    }
}