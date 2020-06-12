import * as THREE from '/build/three.module.js'

class CannonUtils {

    constructor() { }

    public static CreateTrimesh(geometry: THREE.Geometry | THREE.BufferGeometry): CANNON.Trimesh {
        if (!(geometry as THREE.BufferGeometry).attributes) {
            geometry = new THREE.BufferGeometry().fromGeometry(geometry as THREE.Geometry);
        }
        const vertices: number[] = <number[]>(geometry as THREE.BufferGeometry).attributes.position.array
        const indices: number[] = Object.keys(vertices).map(Number);
        return new CANNON.Trimesh(vertices, indices);
    }

    public static CreateConvexPolyhedron(geometry: THREE.Geometry | THREE.BufferGeometry): CANNON.ConvexPolyhedron {
        if (!(geometry as THREE.Geometry).vertices) {
            geometry = new THREE.Geometry().fromBufferGeometry(geometry as THREE.BufferGeometry);
            geometry.mergeVertices()
            geometry.computeBoundingSphere();
            geometry.computeFaceNormals();
        }
        const points: CANNON.Vec3[] = (<THREE.Geometry>geometry).vertices.map(function (v) {
            return new CANNON.Vec3(v.x, v.y, v.z)
        })
        const faces: number[][] = (<THREE.Geometry>geometry).faces.map(function (f) {
            return [f.a, f.b, f.c]
        })

        return new CANNON.ConvexPolyhedron(points, faces);
    }
}

export default CannonUtils;