import * as THREE from '/build/three.module.js';
class CannonUtils {
    constructor() { }
    static CreateTrimesh(geometry) {
        if (!geometry.attributes) {
            geometry = new THREE.BufferGeometry().fromGeometry(geometry);
        }
        const vertices = geometry.attributes.position.array;
        const indices = Object.keys(vertices).map(Number);
        return new CANNON.Trimesh(vertices, indices);
    }
    static CreateConvexPolyhedron(geometry) {
        if (!geometry.vertices) {
            geometry = new THREE.Geometry().fromBufferGeometry(geometry);
            geometry.mergeVertices();
            geometry.computeBoundingSphere();
            geometry.computeFaceNormals();
        }
        const points = geometry.vertices.map(function (v) {
            return new CANNON.Vec3(v.x, v.y, v.z);
        });
        const faces = geometry.faces.map(function (f) {
            return [f.a, f.b, f.c];
        });
        return new CANNON.ConvexPolyhedron(points, faces);
    }
}
export default CannonUtils;
