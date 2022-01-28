// MIT License
// Original file https://github.com/schteppe/cannon.js/blob/908aa1e954b54d05a43dd708584e882dfe30ae29/tools/threejs/CannonDebugRenderer.js CopyRight https://github.com/schteppe
// Differences Copyright 2020-2021 Sean Bradley : https://sbcode.net/threejs/
// - Added import statements for THREE
// - Converted to a class with a default export,
// - Converted to TypeScript
// - Updated to support THREE.BufferGeometry (r125)
// - added support for CANNON.Cylinder
// - Updated to use cannon-es

import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export default class CannonDebugRenderer {
    public scene: THREE.Scene
    public world: CANNON.World
    private _meshes: THREE.Mesh[] | THREE.Points[]
    private _material: THREE.MeshBasicMaterial
    private _particleMaterial = new THREE.PointsMaterial()
    private _sphereGeometry: THREE.SphereGeometry
    private _boxGeometry: THREE.BoxGeometry
    private _cylinderGeometry: THREE.CylinderGeometry
    private _planeGeometry: THREE.PlaneGeometry
    private _particleGeometry: THREE.BufferGeometry

    private tmpVec0: CANNON.Vec3 = new CANNON.Vec3()
    private tmpVec1: CANNON.Vec3 = new CANNON.Vec3()
    private tmpVec2: CANNON.Vec3 = new CANNON.Vec3()
    private tmpQuat0: CANNON.Quaternion = new CANNON.Quaternion()

    constructor(scene: THREE.Scene, world: CANNON.World, options?: object) {
        options = options || {}

        this.scene = scene
        this.world = world

        this._meshes = []

        this._material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
        })
        this._particleMaterial = new THREE.PointsMaterial({
            color: 0xff0000,
            size: 10,
            sizeAttenuation: false,
            depthTest: false,
        })
        this._sphereGeometry = new THREE.SphereGeometry(1)
        this._boxGeometry = new THREE.BoxGeometry(1, 1, 1)
        this._cylinderGeometry = new THREE.CylinderGeometry(1, 1, 2, 8)
        this._planeGeometry = new THREE.PlaneGeometry(10, 10, 10, 10)
        this._particleGeometry = new THREE.BufferGeometry()
        this._particleGeometry.setFromPoints([new THREE.Vector3(0, 0, 0)])
    }

    public update() {
        const bodies: CANNON.Body[] = this.world.bodies
        const meshes: THREE.Mesh[] | THREE.Points[] = this._meshes
        const shapeWorldPosition: CANNON.Vec3 = this.tmpVec0
        const shapeWorldQuaternion: CANNON.Quaternion = this.tmpQuat0

        let meshIndex = 0

        for (let i = 0; i !== bodies.length; i++) {
            const body = bodies[i]

            for (let j = 0; j !== body.shapes.length; j++) {
                const shape = body.shapes[j]

                this._updateMesh(meshIndex, body, shape)

                const mesh = meshes[meshIndex]

                if (mesh) {
                    // Get world position
                    body.quaternion.vmult(
                        body.shapeOffsets[j],
                        shapeWorldPosition
                    )
                    body.position.vadd(shapeWorldPosition, shapeWorldPosition)

                    // Get world quaternion
                    body.quaternion.mult(
                        body.shapeOrientations[j],
                        shapeWorldQuaternion
                    )

                    // Copy to meshes
                    mesh.position.x = shapeWorldPosition.x
                    mesh.position.y = shapeWorldPosition.y
                    mesh.position.z = shapeWorldPosition.z
                    mesh.quaternion.x = shapeWorldQuaternion.x
                    mesh.quaternion.y = shapeWorldQuaternion.y
                    mesh.quaternion.z = shapeWorldQuaternion.z
                    mesh.quaternion.w = shapeWorldQuaternion.w
                }

                meshIndex++
            }
        }

        for (let i = meshIndex; i < meshes.length; i++) {
            const mesh: THREE.Mesh | THREE.Points = meshes[i]
            if (mesh) {
                this.scene.remove(mesh)
            }
        }

        meshes.length = meshIndex
    }

    private _updateMesh(index: number, body: CANNON.Body, shape: CANNON.Shape) {
        let mesh = this._meshes[index]
        if (!this._typeMatch(mesh, shape)) {
            if (mesh) {
                //console.log(shape.type)
                this.scene.remove(mesh)
            }
            mesh = this._meshes[index] = this._createMesh(shape)
        }
        this._scaleMesh(mesh, shape)
    }

    private _typeMatch(
        mesh: THREE.Mesh | THREE.Points,
        shape: CANNON.Shape
    ): boolean {
        if (!mesh) {
            return false
        }
        const geo: THREE.BufferGeometry = mesh.geometry
        return (
            (geo instanceof THREE.SphereGeometry &&
                shape instanceof CANNON.Sphere) ||
            (geo instanceof THREE.BoxGeometry && shape instanceof CANNON.Box) ||
            (geo instanceof THREE.CylinderGeometry &&
                shape instanceof CANNON.Cylinder) ||
            (geo instanceof THREE.PlaneGeometry &&
                shape instanceof CANNON.Plane) ||
            shape instanceof CANNON.ConvexPolyhedron ||
            (geo.id === shape.id && shape instanceof CANNON.Trimesh) ||
            (geo.id === shape.id && shape instanceof CANNON.Heightfield)
        )
    }

    private _createMesh(shape: CANNON.Shape): THREE.Mesh | THREE.Points {
        let mesh: THREE.Mesh | THREE.Points
        let geometry: THREE.BufferGeometry
        let v0: CANNON.Vec3
        let v1: CANNON.Vec3
        let v2: CANNON.Vec3
        const material: THREE.MeshBasicMaterial = this._material
        let points: THREE.Vector3[] = []

        switch (shape.type) {
            case CANNON.Shape.types.SPHERE:
                mesh = new THREE.Mesh(this._sphereGeometry, material)
                break

            case CANNON.Shape.types.BOX:
                mesh = new THREE.Mesh(this._boxGeometry, material)
                break

            case CANNON.Shape.types.CYLINDER:
                geometry = new THREE.CylinderGeometry(
                    (shape as CANNON.Cylinder).radiusTop,
                    (shape as CANNON.Cylinder).radiusBottom,
                    (shape as CANNON.Cylinder).height,
                    (shape as CANNON.Cylinder).numSegments
                )
                mesh = new THREE.Mesh(geometry, material)
                break

            case CANNON.Shape.types.PLANE:
                mesh = new THREE.Mesh(this._planeGeometry, material)
                break

            case CANNON.Shape.types.PARTICLE:
                mesh = new THREE.Points(
                    this._particleGeometry,
                    this._particleMaterial
                )
                break

            case CANNON.Shape.types.CONVEXPOLYHEDRON:
                // Create mesh
                geometry = new THREE.BufferGeometry()
                shape.id = geometry.id
                points = []
                for (
                    let i = 0;
                    i < (shape as CANNON.ConvexPolyhedron).vertices.length;
                    i += 1
                ) {
                    const v = (shape as CANNON.ConvexPolyhedron).vertices[i]
                    points.push(new THREE.Vector3(v.x, v.y, v.z))
                }
                geometry.setFromPoints(points)

                const indices = []
                for (
                    let i = 0;
                    i < (shape as CANNON.ConvexPolyhedron).faces.length;
                    i++
                ) {
                    const face = (shape as CANNON.ConvexPolyhedron).faces[i]
                    const a = face[0]
                    for (let j = 1; j < face.length - 1; j++) {
                        const b = face[j]
                        const c = face[j + 1]
                        indices.push(a, b, c)
                    }
                }

                geometry.setIndex(indices)

                mesh = new THREE.Mesh(geometry, material)

                break

            case CANNON.Shape.types.TRIMESH:
                geometry = new THREE.BufferGeometry()
                shape.id = geometry.id
                points = []
                for (
                    let i = 0;
                    i < (shape as CANNON.Trimesh).vertices.length;
                    i += 3
                ) {
                    points.push(
                        new THREE.Vector3(
                            (shape as CANNON.Trimesh).vertices[i],
                            (shape as CANNON.Trimesh).vertices[i + 1],
                            (shape as CANNON.Trimesh).vertices[i + 2]
                        )
                    )
                }
                geometry.setFromPoints(points)
                mesh = new THREE.Mesh(geometry, material)

                break

            case CANNON.Shape.types.HEIGHTFIELD:
                geometry = new THREE.BufferGeometry()

                v0 = this.tmpVec0
                v1 = this.tmpVec1
                v2 = this.tmpVec2
                for (
                    let xi = 0;
                    xi < (shape as CANNON.Heightfield).data.length - 1;
                    xi++
                ) {
                    for (
                        let yi = 0;
                        yi < (shape as CANNON.Heightfield).data[xi].length - 1;
                        yi++
                    ) {
                        for (let k = 0; k < 2; k++) {
                            ;(
                                shape as CANNON.Heightfield
                            ).getConvexTrianglePillar(xi, yi, k === 0)
                            v0.copy(
                                (shape as CANNON.Heightfield).pillarConvex
                                    .vertices[0]
                            )
                            v1.copy(
                                (shape as CANNON.Heightfield).pillarConvex
                                    .vertices[1]
                            )
                            v2.copy(
                                (shape as CANNON.Heightfield).pillarConvex
                                    .vertices[2]
                            )
                            v0.vadd(
                                (shape as CANNON.Heightfield).pillarOffset,
                                v0
                            )
                            v1.vadd(
                                (shape as CANNON.Heightfield).pillarOffset,
                                v1
                            )
                            v2.vadd(
                                (shape as CANNON.Heightfield).pillarOffset,
                                v2
                            )
                            points.push(
                                new THREE.Vector3(v0.x, v0.y, v0.z),
                                new THREE.Vector3(v1.x, v1.y, v1.z),
                                new THREE.Vector3(v2.x, v2.y, v2.z)
                            )
                            //const i = geometry.vertices.length - 3
                            //geometry.faces.push(new THREE.Face3(i, i + 1, i + 2))
                        }
                    }
                }
                geometry.setFromPoints(points)
                //geometry.computeBoundingSphere()
                //geometry.computeFaceNormals()
                mesh = new THREE.Mesh(geometry, material)
                shape.id = geometry.id
                break
            default:
                mesh = new THREE.Mesh()
                break
        }

        if (mesh && mesh.geometry) {
            this.scene.add(mesh)
        }

        return mesh
    }

    private _scaleMesh(mesh: THREE.Mesh | THREE.Points, shape: CANNON.Shape) {
        let radius: number
        let halfExtents: CANNON.Vec3
        let scale: CANNON.Vec3

        switch (shape.type) {
            case CANNON.Shape.types.SPHERE:
                radius = (shape as CANNON.Sphere).radius
                mesh.scale.set(radius, radius, radius)
                break

            case CANNON.Shape.types.BOX:
                halfExtents = (shape as CANNON.Box).halfExtents
                mesh.scale.copy(
                    new THREE.Vector3(
                        halfExtents.x,
                        halfExtents.y,
                        halfExtents.z
                    )
                )
                mesh.scale.multiplyScalar(2)
                break

            case CANNON.Shape.types.CONVEXPOLYHEDRON:
                mesh.scale.set(1, 1, 1)
                break

            case CANNON.Shape.types.TRIMESH:
                scale = (shape as CANNON.Trimesh).scale
                mesh.scale.copy(new THREE.Vector3(scale.x, scale.y, scale.z))
                break

            case CANNON.Shape.types.HEIGHTFIELD:
                mesh.scale.set(1, 1, 1)
                break
        }
    }
}