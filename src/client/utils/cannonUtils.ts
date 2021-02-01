import * as THREE from '/build/three.module.js'

class CannonUtils {

    constructor() { }

    public static CreateTrimesh(geometry: THREE.BufferGeometry): CANNON.Trimesh {
        const vertices: number[] = <number[]>geometry.attributes.position.array
        const indices: number[] = Object.keys(vertices).map(Number)
        return new CANNON.Trimesh(vertices, indices)
    }


    public static CreateConvexPolyhedron(geometry: THREE.BufferGeometry): CANNON.ConvexPolyhedron {
        const position = geometry.attributes.position.array
        const points: CANNON.Vec3[] = []
        for (let i = 0; i < position.length; i += 3) {
            const x = position[i]
            const y = position[i + 1]
            const z = position[i + 2]
            points.push(new CANNON.Vec3(x, y, z));
        }
        const faces: number[][] = []
        for (let i = 0; i < position.length / 3; i += 3) {
            faces.push([i, i + 1, i + 2])
        }
        return new CANNON.ConvexPolyhedron(points, faces);
    }
}

export default CannonUtils