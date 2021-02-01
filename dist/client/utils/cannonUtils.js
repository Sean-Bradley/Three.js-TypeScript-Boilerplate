class CannonUtils {
    constructor() { }
    static CreateTrimesh(geometry) {
        const vertices = geometry.attributes.position.array;
        const indices = Object.keys(vertices).map(Number);
        return new CANNON.Trimesh(vertices, indices);
    }
    static CreateConvexPolyhedron(geometry) {
        const position = geometry.attributes.position.array;
        const points = [];
        for (let i = 0; i < position.length; i += 3) {
            const x = position[i];
            const y = position[i + 1];
            const z = position[i + 2];
            points.push(new CANNON.Vec3(x, y, z));
        }
        const faces = [];
        for (let i = 0; i < position.length / 3; i += 3) {
            faces.push([i, i + 1, i + 2]);
        }
        return new CANNON.ConvexPolyhedron(points, faces);
    }
}
export default CannonUtils;
