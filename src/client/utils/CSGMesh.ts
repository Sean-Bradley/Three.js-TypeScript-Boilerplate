/**
 *
 * Copyright (c) 2011 Evan Wallace (http://madebyevan.com/), under the MIT license.
 * THREE.js rework by thrax
 *
 * # class CSG
 * Holds a binary space partition tree representing a 3D solid. Two solids can
 * be combined using the `union()`, `subtract()`, and `intersect()` methods.
 *
 * Differences Copyright 2020-2021 Sean Bradley : https://sbcode.net/threejs/
 * - Started with CSGMesh.js and csg-lib.js from https://github.com/manthrax/THREE-CSGMesh
 * - Converted to TypeScript by adding type annotations to all variables
 * - Converted var to const and let
 * - Some Refactoring
 * - support for three r130
 */

import * as THREE from 'three'

class CSG {
    polygons: Polygon[]

    constructor() {
        this.polygons = []
    }
    clone() {
        const csg = new CSG()
        csg.polygons = this.polygons.map(function (p) {
            return p.clone()
        })
        return csg
    }

    toPolygons() {
        return this.polygons
    }

    union(csg: CSG) {
        let a = new Node(this.clone().polygons)
        let b = new Node(csg.clone().polygons)
        a.clipTo(b)
        b.clipTo(a)
        b.invert()
        b.clipTo(a)
        b.invert()
        a.build(b.allPolygons())
        return CSG.fromPolygons(a.allPolygons())
    }

    subtract(csg: CSG) {
        let a = new Node(this.clone().polygons)
        let b = new Node(csg.clone().polygons)
        a.invert()
        a.clipTo(b)
        b.clipTo(a)
        b.invert()
        b.clipTo(a)
        b.invert()
        a.build(b.allPolygons())
        a.invert()
        return CSG.fromPolygons(a.allPolygons())
    }

    intersect(csg: CSG) {
        let a = new Node(this.clone().polygons)
        let b = new Node(csg.clone().polygons)
        a.invert()
        b.clipTo(a)
        b.invert()
        a.clipTo(b)
        b.clipTo(a)
        a.build(b.allPolygons())
        a.invert()
        return CSG.fromPolygons(a.allPolygons())
    }

    // Return a new CSG solid with solid and empty space switched. This solid is
    // not modified.
    inverse() {
        const csg = this.clone()
        csg.polygons.map(function (p) {
            p.flip()
        })
        return csg
    }

    // Construct a CSG solid from a list of `Polygon` instances.
    static fromPolygons = function (polygons: Polygon[]) {
        const csg = new CSG()
        csg.polygons = polygons
        return csg
    }

    static fromGeometry = function (
        geom: THREE.BufferGeometry,
        objectIndex?: object
    ) {
        let polys = []
        let posattr = geom.attributes.position
        let normalattr = geom.attributes.normal
        let uvattr = geom.attributes.uv
        let colorattr = geom.attributes.color
        let index: number[]
        if (geom.index) {
            index = geom.index.array as number[]
        } else {
            index = new Array((posattr.array.length / posattr.itemSize) | 0)
            for (let i = 0; i < index.length; i++) index[i] = i
        }
        let triCount = (index.length / 3) | 0
        polys = new Array(triCount)
        for (let i = 0, pli = 0, l = index.length; i < l; i += 3, pli++) {
            let vertices = new Array(3)
            for (let j = 0; j < 3; j++) {
                let vi = index[i + j]
                let vp = vi * 3
                let vt = vi * 2
                let x = posattr.array[vp]
                let y = posattr.array[vp + 1]
                let z = posattr.array[vp + 2]
                let nx = normalattr.array[vp]
                let ny = normalattr.array[vp + 1]
                let nz = normalattr.array[vp + 2]
                let u = uvattr.array[vt]
                let v = uvattr.array[vt + 1]
                vertices[j] = new Vertex(
                    {
                        x: x,
                        y: y,
                        z: z
                    } as Vector,
                    {
                        x: nx,
                        y: ny,
                        z: nz
                    } as Vector,
                    {
                        x: u,
                        y: v,
                        z: 0
                    } as Vector,
                    colorattr &&
                    ({
                        x: colorattr.array[vt],
                        y: colorattr.array[vt + 1],
                        z: colorattr.array[vt + 2]
                    } as Vector)
                )
            }
            polys[pli] = new Polygon(vertices, objectIndex)
        }
        return CSG.fromPolygons(polys)
    }

    private static ttvv0 = new THREE.Vector3()
    private static tmpm3 = new THREE.Matrix3()

    static fromMesh = function (mesh: THREE.Mesh, objectIndex?: object) {
        const csg = CSG.fromGeometry(mesh.geometry, objectIndex)
        CSG.tmpm3.getNormalMatrix(mesh.matrix)
        for (let i = 0; i < csg.polygons.length; i++) {
            let p = csg.polygons[i]
            for (let j = 0; j < p.vertices.length; j++) {
                let v = p.vertices[j]
                v.pos.copy(
                    CSG.ttvv0
                        .copy(new THREE.Vector3(v.pos.x, v.pos.y, v.pos.z))
                        .applyMatrix4(mesh.matrix)
                )
                v.normal.copy(
                    CSG.ttvv0
                        .copy(
                            new THREE.Vector3(
                                v.normal.x,
                                v.normal.y,
                                v.normal.z
                            )
                        )
                        .applyMatrix3(CSG.tmpm3)
                )
            }
        }
        return csg
    }

    static nbuf3 = (ct: number) => {
        return {
            top: 0,
            array: new Float32Array(ct),
            write: function (v: Vector) {
                this.array[this.top++] = v.x
                this.array[this.top++] = v.y
                this.array[this.top++] = v.z
            }
        }
    }
    static nbuf2 = (ct: number) => {
        return {
            top: 0,
            array: new Float32Array(ct),
            write: function (v: Vector) {
                this.array[this.top++] = v.x
                this.array[this.top++] = v.y
            }
        }
    }

    static toMesh = function (
        csg: CSG,
        toMatrix: THREE.Matrix4,
        toMaterial?: THREE.Material
    ) {
        let ps = csg.polygons
        let geom: THREE.BufferGeometry

        let triCount = 0
        ps.forEach((p) => (triCount += p.vertices.length - 2))
        geom = new THREE.BufferGeometry()

        let vertices = CSG.nbuf3(triCount * 3 * 3)
        let normals = CSG.nbuf3(triCount * 3 * 3)
        let uvs = CSG.nbuf2(triCount * 2 * 3)
        let colors: any
        let grps: any[] = []
        ps.forEach((p) => {
            let pvs = p.vertices
            let pvlen = pvs.length
            if (p.shared !== undefined) {
                if (!grps[p.shared]) grps[p.shared] = []
            }
            if (pvlen && pvs[0].color !== undefined) {
                if (!colors) colors = CSG.nbuf3(triCount * 3 * 3)
            }
            for (let j = 3; j <= pvlen; j++) {
                p.shared !== undefined &&
                    grps[p.shared].push(
                        vertices.top / 3,
                        vertices.top / 3 + 1,
                        vertices.top / 3 + 2
                    )
                vertices.write(pvs[0].pos)
                vertices.write(pvs[j - 2].pos)
                vertices.write(pvs[j - 1].pos)
                normals.write(pvs[0].normal)
                normals.write(pvs[j - 2].normal)
                normals.write(pvs[j - 1].normal)
                uvs.write(pvs[0].uv)
                uvs.write(pvs[j - 2].uv)
                uvs.write(pvs[j - 1].uv)
                colors &&
                    (colors.write(pvs[0].color) ||
                        colors.write(pvs[j - 2].color) ||
                        colors.write(pvs[j - 1].color))
            }
        })
        geom.setAttribute(
            'position',
            new THREE.BufferAttribute(vertices.array, 3)
        )
        geom.setAttribute('normal', new THREE.BufferAttribute(normals.array, 3))
        geom.setAttribute('uv', new THREE.BufferAttribute(uvs.array, 2))
        colors &&
            geom.setAttribute(
                'color',
                new THREE.BufferAttribute(colors.array, 3)
            )
        if (grps.length) {
            let index: any[] = []
            let gbase = 0
            for (let gi = 0; gi < grps.length; gi++) {
                geom.addGroup(gbase, grps[gi].length, gi)
                gbase += grps[gi].length
                index = index.concat(grps[gi])
            }
            geom.setIndex(index)
        }

        let inv = new THREE.Matrix4().copy(toMatrix).invert()
        geom.applyMatrix4(inv)
        geom.computeBoundingSphere()
        geom.computeBoundingBox()
        let m = new THREE.Mesh(geom, toMaterial)
        m.matrix.copy(toMatrix)
        m.matrix.decompose(m.position, m.quaternion, m.scale)
        m.rotation.setFromQuaternion(m.quaternion)
        m.updateMatrixWorld()
        m.castShadow = m.receiveShadow = true
        return m
    }
}
// # class Vector

// Represents a 3D vector.
//
// Example usage:
//
//     new CSG.Vector(1, 2, 3);

class Vector {
    x: number
    y: number
    z: number
    constructor(x = 0, y = 0, z = 0) {
        this.x = x
        this.y = y
        this.z = z
    }
    copy(v: any) {
        this.x = v.x
        this.y = v.y
        this.z = v.z
        return this
    }
    clone() {
        return new Vector(this.x, this.y, this.z)
    }
    negate() {
        this.x *= -1
        this.y *= -1
        this.z *= -1
        return this
    }
    add(a: Vector) {
        this.x += a.x
        this.y += a.y
        this.z += a.z
        return this
    }
    sub(a: Vector) {
        this.x -= a.x
        this.y -= a.y
        this.z -= a.z
        return this
    }
    times(a: number) {
        this.x *= a
        this.y *= a
        this.z *= a
        return this
    }
    dividedBy(a: number) {
        this.x /= a
        this.y /= a
        this.z /= a
        return this
    }
    lerp(a: Vector, t: number) {
        return this.add(tv0.copy(a).sub(this).times(t))
    }
    unit() {
        return this.dividedBy(this.length())
    }
    length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2)
    }
    normalize() {
        return this.unit()
    }
    cross(b: Vector) {
        let a = this
        const ax = a.x,
            ay = a.y,
            az = a.z
        const bx = b.x,
            by = b.y,
            bz = b.z

        this.x = ay * bz - az * by
        this.y = az * bx - ax * bz
        this.z = ax * by - ay * bx

        return this
    }
    dot(b: Vector) {
        return this.x * b.x + this.y * b.y + this.z * b.z
    }
}

//Temporaries used to avoid internal allocation..
let tv0 = new Vector(0, 0, 0)
let tv1 = new Vector(0, 0, 0)

// # class Vertex

// Represents a vertex of a polygon. Use your own vertex class instead of this
// one to provide additional features like texture coordinates and vertex
// colors. Custom vertex classes need to provide a `pos` property and `clone()`,
// `flip()`, and `interpolate()` methods that behave analogous to the ones
// defined by `CSG.Vertex`. This class provides `normal` so convenience
// functions like `CSG.sphere()` can return a smooth vertex normal, but `normal`
// is not used anywhere else.

class Vertex {
    pos: Vector
    normal: Vector
    uv: Vector
    color: any
    constructor(pos: Vector, normal: Vector, uv?: Vector, color?: Vector) {
        this.pos = new Vector().copy(pos)
        this.normal = new Vector().copy(normal)
        this.uv = new Vector().copy(uv)
        this.uv.z = 0
        color && (this.color = new Vector().copy(color))
    }

    clone() {
        return new Vertex(this.pos, this.normal, this.uv, this.color)
    }

    // Invert all orientation-specific data (e.g. vertex normal). Called when the
    // orientation of a polygon is flipped.
    flip() {
        this.normal.negate()
    }

    // Create a new vertex between this vertex and `other` by linearly
    // interpolating all properties using a parameter of `t`. Subclasses should
    // override this to interpolate additional properties.
    interpolate(other: Vertex, t: number) {
        return new Vertex(
            this.pos.clone().lerp(other.pos, t),
            this.normal.clone().lerp(other.normal, t),
            this.uv.clone().lerp(other.uv, t),
            this.color && other.color && this.color.clone().lerp(other.color, t)
        )
    }
}

// # class Plane

// Represents a plane in 3D space.

class Plane {
    normal: Vector
    w: number
    constructor(normal: Vector, w: number) {
        this.normal = normal
        this.w = w
    }

    clone() {
        return new Plane(this.normal.clone(), this.w)
    }

    flip() {
        this.normal.negate()
        this.w = -this.w
    }

    // Split `polygon` by this plane if needed, then put the polygon or polygon
    // fragments in the appropriate lists. Coplanar polygons go into either
    // `coplanarFront` or `coplanarBack` depending on their orientation with
    // respect to this plane. Polygons in front or in back of this plane go into
    // either `front` or `back`.
    splitPolygon(
        polygon: Polygon,
        coplanarFront: Polygon[],
        coplanarBack: Polygon[],
        front: Polygon[],
        back: Polygon[]
    ) {
        const COPLANAR = 0
        const FRONT = 1
        const BACK = 2
        const SPANNING = 3

        // Classify each point as well as the entire polygon into one of the above
        // four classes.
        let polygonType = 0
        let types = []
        for (let i = 0; i < polygon.vertices.length; i++) {
            let t = this.normal.dot(polygon.vertices[i].pos) - this.w
            let type =
                t < -Plane.EPSILON ? BACK : t > Plane.EPSILON ? FRONT : COPLANAR
            polygonType |= type
            types.push(type)
        }

        // Put the polygon in the correct list, splitting it when necessary.
        switch (polygonType) {
            case COPLANAR:
                ; (this.normal.dot(polygon.plane.normal) > 0
                    ? coplanarFront
                    : coplanarBack
                ).push(polygon)
                break
            case FRONT:
                front.push(polygon)
                break
            case BACK:
                back.push(polygon)
                break
            case SPANNING:
                let f = [],
                    b = []
                for (let i = 0; i < polygon.vertices.length; i++) {
                    let j = (i + 1) % polygon.vertices.length
                    let ti = types[i],
                        tj = types[j]
                    let vi = polygon.vertices[i],
                        vj = polygon.vertices[j]
                    if (ti != BACK) f.push(vi)
                    if (ti != FRONT) b.push(ti != BACK ? vi.clone() : vi)
                    if ((ti | tj) == SPANNING) {
                        let t =
                            (this.w - this.normal.dot(vi.pos)) /
                            this.normal.dot(tv0.copy(vj.pos).sub(vi.pos))
                        let v = vi.interpolate(vj, t)
                        f.push(v)
                        b.push(v.clone())
                    }
                }
                if (f.length >= 3) front.push(new Polygon(f, polygon.shared))
                if (b.length >= 3) back.push(new Polygon(b, polygon.shared))
                break
        }
    }

    // `Plane.EPSILON` is the tolerance used by `splitPolygon()` to decide if a
    // point is on the plane.
    static EPSILON = 1e-5

    static fromPoints = function (a: Vector, b: Vector, c: Vector) {
        let n = tv0.copy(b).sub(a).cross(tv1.copy(c).sub(a)).normalize()
        return new Plane(n.clone(), n.dot(a))
    }
}

// # class Polygon

// Represents a convex polygon. The vertices used to initialize a polygon must
// be coplanar and form a convex loop. They do not have to be `Vertex`
// instances but they must behave similarly (duck typing can be used for
// customization).
//
// Each convex polygon has a `shared` property, which is shared between all
// polygons that are clones of each other or were split from the same polygon.
// This can be used to define per-polygon properties (such as surface color).

class Polygon {
    vertices: Vertex[]
    shared: any
    plane: Plane

    constructor(vertices: Vertex[], shared?: any) {
        this.vertices = vertices
        this.shared = shared
        this.plane = Plane.fromPoints(
            vertices[0].pos as Vector,
            vertices[1].pos as Vector,
            vertices[2].pos as Vector
        )
    }
    clone() {
        return new Polygon(
            this.vertices.map((v) => v.clone()),
            this.shared
        )
    }
    flip() {
        this.vertices.reverse().map((v) => v.flip())
        this.plane.flip()
    }
}

// # class Node

// Holds a node in a BSP tree. A BSP tree is built from a collection of polygons
// by picking a polygon to split along. That polygon (and all other coplanar
// polygons) are added directly to that node and the other polygons are added to
// the front and/or back subtrees. This is not a leafy BSP tree since there is
// no distinction between internal and leaf nodes.

class Node {
    plane?: Plane
    front?: Node
    back?: Node
    polygons: Polygon[]

    constructor(polygons?: Polygon[]) {
        this.polygons = []
        if (polygons) this.build(polygons)
    }
    clone() {
        let node = new Node()
        node.plane = this.plane && this.plane.clone()
        node.front = this.front && this.front.clone()
        node.back = this.back && this.back.clone()
        node.polygons = this.polygons.map((p) => p.clone())
        return node
    }

    // Convert solid space to empty space and empty space to solid space.
    invert() {
        for (let i = 0; i < this.polygons.length; i++) this.polygons[i].flip()

        this.plane && this.plane.flip()
        this.front && this.front.invert()
        this.back && this.back.invert()
        let temp = this.front
        this.front = this.back
        this.back = temp
    }

    // Recursively remove all polygons in `polygons` that are inside this BSP
    // tree.
    clipPolygons(polygons: Polygon[]) {
        if (!this.plane) return polygons.slice()
        let front: Polygon[] = []
        let back: Polygon[] = []
        for (let i = 0; i < polygons.length; i++) {
            this.plane.splitPolygon(polygons[i], front, back, front, back)
        }
        if (this.front) front = this.front.clipPolygons(front)
        if (this.back) back = this.back.clipPolygons(back)
        else back = []
        return front.concat(back)
    }

    // Remove all polygons in this BSP tree that are inside the other BSP tree
    // `bsp`.
    clipTo(bsp: Node) {
        this.polygons = bsp.clipPolygons(this.polygons)
        if (this.front) this.front.clipTo(bsp)
        if (this.back) this.back.clipTo(bsp)
    }

    // Return a list of all polygons in this BSP tree.
    allPolygons() {
        let polygons = this.polygons.slice()
        if (this.front) polygons = polygons.concat(this.front.allPolygons())
        if (this.back) polygons = polygons.concat(this.back.allPolygons())
        return polygons
    }

    // Build a BSP tree out of `polygons`. When called on an existing tree, the
    // new polygons are filtered down to the bottom of the tree and become new
    // nodes there. Each set of polygons is partitioned using the first polygon
    // (no heuristic is used to pick a good split).
    build(polygons: Polygon[]) {
        if (!polygons.length) return
        if (!this.plane) this.plane = polygons[0].plane.clone()
        let front: Polygon[] = []
        let back: Polygon[] = []
        for (let i = 0; i < polygons.length; i++) {
            this.plane.splitPolygon(
                polygons[i],
                this.polygons,
                this.polygons,
                front,
                back
            )
        }
        if (front.length) {
            if (!this.front) this.front = new Node()
            this.front.build(front)
        }
        if (back.length) {
            if (!this.back) this.back = new Node()
            this.back.build(back)
        }
    }

    static fromJSON = function (json: CSG) {
        return CSG.fromPolygons(
            json.polygons.map(
                (p) =>
                    new Polygon(
                        p.vertices.map(
                            (v) => new Vertex(v.pos, v.normal, v.uv)
                        ),
                        p.shared
                    )
            )
        )
    }
}

export { CSG, Vertex, Vector, Polygon, Plane }

// Return a new CSG solid representing space in either this solid or in the
// solid `csg`. Neither this solid nor the solid `csg` are modified.
//
//     A.union(B)
//
//     +-------+            +-------+
//     |       |            |       |
//     |   A   |            |       |
//     |    +--+----+   =   |       +----+
//     +----+--+    |       +----+       |
//          |   B   |            |       |
//          |       |            |       |
//          +-------+            +-------+
//
// Return a new CSG solid representing space in this solid but not in the
// solid `csg`. Neither this solid nor the solid `csg` are modified.
//
//     A.subtract(B)
//
//     +-------+            +-------+
//     |       |            |       |
//     |   A   |            |       |
//     |    +--+----+   =   |    +--+
//     +----+--+    |       +----+
//          |   B   |
//          |       |
//          +-------+
//
// Return a new CSG solid representing space both this solid and in the
// solid `csg`. Neither this solid nor the solid `csg` are modified.
//
//     A.intersect(B)
//
//     +-------+
//     |       |
//     |   A   |
//     |    +--+----+   =   +--+
//     +----+--+    |       +--+
//          |   B   |
//          |       |
//          +-------+
//