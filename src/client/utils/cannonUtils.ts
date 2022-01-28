//MIT License
//Copyright (c) 2020-2022 Sean Bradley
import * as THREE from 'three'
import * as CANNON from 'cannon-es'

interface Face3 {
    a: number
    b: number
    c: number
    normals: THREE.Vector3[]
}

class CannonUtils {
    public static CreateTrimesh(geometry: THREE.BufferGeometry): CANNON.Trimesh {
        const vertices = geometry.clone().toNonIndexed().attributes.position.array as number[]
        const indices = Object.keys(vertices).map(Number)
        return new CANNON.Trimesh(vertices, indices)
    }

    public static CreateConvexPolyhedron(geometry: THREE.BufferGeometry): CANNON.ConvexPolyhedron {
        const position = geometry.attributes.position
        const normal = geometry.attributes.normal
        const vertices: THREE.Vector3[] = []
        for (let i = 0; i < position.count; i++) {
            vertices.push(new THREE.Vector3().fromBufferAttribute(position, i))
        }
        const faces: Face3[] = []
        for (let i = 0; i < position.count; i += 3) {
            const vertexNormals =
                normal === undefined
                    ? []
                    : [
                          new THREE.Vector3().fromBufferAttribute(normal, i),
                          new THREE.Vector3().fromBufferAttribute(normal, i + 1),
                          new THREE.Vector3().fromBufferAttribute(normal, i + 2),
                      ]
            const face: Face3 = {
                a: i,
                b: i + 1,
                c: i + 2,
                normals: vertexNormals,
            }
            faces.push(face)
        }

        const verticesMap: { [key: string]: number } = {}
        const points: CANNON.Vec3[] = []
        const changes: number[] = []
        for (let i = 0, il = vertices.length; i < il; i++) {
            const v = vertices[i]
            const key =
                Math.round(v.x * 100) + '_' + Math.round(v.y * 100) + '_' + Math.round(v.z * 100)
            if (verticesMap[key] === undefined) {
                verticesMap[key] = i
                points.push(new CANNON.Vec3(vertices[i].x, vertices[i].y, vertices[i].z))
                changes[i] = points.length - 1
            } else {
                changes[i] = changes[verticesMap[key]]
            }
        }

        const faceIdsToRemove = []
        for (let i = 0, il = faces.length; i < il; i++) {
            const face = faces[i]
            face.a = changes[face.a]
            face.b = changes[face.b]
            face.c = changes[face.c]
            const indices = [face.a, face.b, face.c]
            for (let n = 0; n < 3; n++) {
                if (indices[n] === indices[(n + 1) % 3]) {
                    faceIdsToRemove.push(i)
                    break
                }
            }
        }

        for (let i = faceIdsToRemove.length - 1; i >= 0; i--) {
            const idx = faceIdsToRemove[i]
            faces.splice(idx, 1)
        }

        const cannonFaces: number[][] = faces.map(function (f) {
            return [f.a, f.b, f.c]
        })

        return new CANNON.ConvexPolyhedron({
            vertices: points,
            faces: cannonFaces,
        })
    }

    public static offsetCenterOfMass(body: CANNON.Body, centreOfMass: CANNON.Vec3): void {
        body.shapeOffsets.forEach(function (offset) {
            centreOfMass.vadd(offset, centreOfMass)
        })
        centreOfMass.scale(1 / body.shapes.length, centreOfMass)
        body.shapeOffsets.forEach(function (offset) {
            offset.vsub(centreOfMass, offset)
        })
        const worldCenterOfMass = new CANNON.Vec3()
        body.vectorToWorldFrame(centreOfMass, worldCenterOfMass)
        body.position.vadd(worldCenterOfMass, body.position)
    }
}

export default CannonUtils
