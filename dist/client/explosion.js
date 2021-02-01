import * as THREE from '/build/three.module.js';
export default class Explosion {
    constructor(color, scene) {
        this.particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let j = 0; j < this.particleCount; j++) {
            let vertex = new THREE.Vector3();
            vertices.push(vertex);
        }
        particleGeometry.setFromPoints(vertices);
        const pMaterial = new THREE.PointsMaterial({
            color: color,
            size: 1
        });
        this.particles = new THREE.Points(particleGeometry, pMaterial);
        scene.add(this.particles);
        this.particles.visible = false;
    }
    explode(position) {
        this.particles.position.x = position.x;
        this.particles.position.y = position.y;
        this.particles.position.z = position.z;
        const positions = this.particles.geometry.attributes.position.array;
        for (let j = 0; j < this.particleCount * 3; j = j + 3) {
            let v = new THREE.Vector3((Math.random() * 0.5) - 0.25, Math.random() * 0.25, (Math.random() * 0.5) - 0.25);
            positions[j] = v.x;
            positions[j + 1] = v.y;
            positions[j + 2] = v.z;
        }
        this.particles.geometry.attributes.position.needsUpdate = true;
        this.particles.userData.explosionPower = 1.2;
        this.particles.visible = true;
    }
    update() {
        if (!this.particles.visible)
            return;
        const positions = this.particles.geometry.attributes.position.array;
        for (let j = 0; j < this.particleCount * 3; j = j + 3) {
            const v = new THREE.Vector3(positions[j], positions[j + 1], positions[j + 2]).multiplyScalar(this.particles.userData.explosionPower);
            positions[j] = v.x;
            positions[j + 1] = v.y;
            positions[j + 2] = v.z;
        }
        if (this.particles.userData.explosionPower > 1.15) {
            this.particles.userData.explosionPower -= 0.001;
        }
        else {
            this.particles.visible = false;
        }
        this.particles.geometry.attributes.position.needsUpdate = true;
    }
}
