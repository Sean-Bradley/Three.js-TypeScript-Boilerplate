// MIT License
// Original file https://github.com/schteppe/cannon.js/blob/908aa1e954b54d05a43dd708584e882dfe30ae29/tools/threejs/CannonDebugRenderer.js CopyRight https://github.com/schteppe
// Differences Copyright 2020 Sean Bradley : https://sbcode.net/threejs/
// - Added import statements for THREE
// - Converted to a class with a default export,
// - Converted to TypeScript
// - Added cylinder geometry, particle geometry and material
// - Highlight faces that the CONVEXPOLYHEDRON thinks are pointing into the shape.

import * as THREE from "/build/three.module.js";

export default class CannonDebugRenderer {
  public scene: THREE.Scene;
  public world: CANNON.World;
  private _meshes: THREE.Mesh[] | THREE.Points[];
  private _material: THREE.MeshBasicMaterial;
  private _particleMaterial = new THREE.PointsMaterial();
  private _sphereGeometry: THREE.SphereGeometry;
  private _boxGeometry: THREE.BoxGeometry;
  private _planeGeometry: THREE.PlaneGeometry;
  private _cylinderGeometry: THREE.CylinderGeometry;
  private _particleGeometry: THREE.Geometry;

  private tmpVec0: CANNON.Vec3 = new CANNON.Vec3()
  private tmpVec1: CANNON.Vec3 = new CANNON.Vec3()
  private tmpVec2: CANNON.Vec3 = new CANNON.Vec3()
  private tmpQuat0: CANNON.Quaternion = new CANNON.Quaternion()

  constructor(scene: THREE.Scene, world: CANNON.World, options?: object) {
    options = options || {}

    this.scene = scene
    this.world = world

    this._meshes = new Array()

    this._material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true
    });
    this._particleMaterial = new THREE.PointsMaterial({
      color: 0xff0000,
      size: 10,
      sizeAttenuation: false,
      depthTest: false
    });
    this._sphereGeometry = new THREE.SphereGeometry(1);
    this._boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    this._planeGeometry = new THREE.PlaneGeometry(10, 10, 10, 10);
    this._cylinderGeometry = new THREE.CylinderGeometry(1, 1, 10, 10);
    this._particleGeometry = new THREE.Geometry();
    this._particleGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
  }

  public update() {
    const bodies: CANNON.Body[] = this.world.bodies;
    const meshes: THREE.Mesh[] | THREE.Points[] = this._meshes;
    const shapeWorldPosition: CANNON.Vec3 = this.tmpVec0;
    const shapeWorldQuaternion: CANNON.Quaternion = this.tmpQuat0;

    let meshIndex = 0;

    for (let i = 0; i !== bodies.length; i++) {
      const body = bodies[i];

      for (let j = 0; j !== body.shapes.length; j++) {
        let shape = body.shapes[j];

        this._updateMesh(meshIndex, body, shape);

        let mesh = meshes[meshIndex];

        if (mesh) {
          // Get world position
          body.quaternion.vmult(body.shapeOffsets[j], shapeWorldPosition);
          body.position.vadd(shapeWorldPosition, shapeWorldPosition);

          // Get world quaternion
          body.quaternion.mult(body.shapeOrientations[j], shapeWorldQuaternion);

          // Copy to meshes
          mesh.position.x = shapeWorldPosition.x;
          mesh.position.y = shapeWorldPosition.y;
          mesh.position.z = shapeWorldPosition.z;
          mesh.quaternion.x = shapeWorldQuaternion.x;
          mesh.quaternion.y = shapeWorldQuaternion.y;
          mesh.quaternion.z = shapeWorldQuaternion.z;
          mesh.quaternion.w = shapeWorldQuaternion.w;
        }

        meshIndex++;
      }
    }

    for (let i = meshIndex; i < meshes.length; i++) {
      const mesh: THREE.Mesh | THREE.Points = meshes[i];
      if (mesh) {
        this.scene.remove(mesh);
      }
    }

    meshes.length = meshIndex;
  }

  private _updateMesh(index: number, body: CANNON.Body, shape: CANNON.Shape) {
    let mesh = this._meshes[index];
    if (!this._typeMatch(mesh, shape)) {
      if (mesh) {
        this.scene.remove(mesh);
      }
      mesh = this._meshes[index] = this._createMesh(shape);
    }
    this._scaleMesh(mesh, shape);
  }

  private _typeMatch(
    mesh: THREE.Mesh | THREE.Points,
    shape: CANNON.Shape
  ): Boolean {
    if (!mesh) {
      return false;
    }
    const geo: THREE.Geometry | THREE.BufferGeometry = mesh.geometry;
    return (
      (geo instanceof THREE.SphereGeometry && shape instanceof CANNON.Sphere) ||
      (geo instanceof THREE.BoxGeometry && shape instanceof CANNON.Box) ||
      (geo instanceof THREE.PlaneGeometry && shape instanceof CANNON.Plane) ||
      (geo.id === shape.geometryId &&
        shape instanceof CANNON.ConvexPolyhedron) ||
      (geo.id === shape.geometryId && shape instanceof CANNON.Trimesh) ||
      (geo.id === shape.geometryId && shape instanceof CANNON.Heightfield)
    );
  }

  private _createMesh(shape: CANNON.Shape): THREE.Mesh | THREE.Points {
    let mesh: THREE.Mesh | THREE.Points = new THREE.Mesh()
    let geometry: THREE.Geometry
    let v0: CANNON.Vec3
    let v1: CANNON.Vec3
    let v2: CANNON.Vec3
    const material: THREE.MeshBasicMaterial = this._material;

    switch (shape.type) {
      case CANNON.Shape.types.SPHERE:
        mesh = new THREE.Mesh(this._sphereGeometry, material);
        break;

      case CANNON.Shape.types.BOX:
        mesh = new THREE.Mesh(this._boxGeometry, material);
        break;

      case CANNON.Shape.types.PLANE:
        mesh = new THREE.Mesh(this._planeGeometry, material);
        break;

      case CANNON.Shape.types.CYLINDER:
        mesh = new THREE.Mesh(this._cylinderGeometry, material);
        break;

      case CANNON.Shape.types.PARTICLE:
        mesh = new THREE.Points(this._particleGeometry, this._particleMaterial);
        break;

      case CANNON.Shape.types.CONVEXPOLYHEDRON:
        // Create mesh
        geometry = new THREE.Geometry();

        // Add vertices
        for (
          let i = 0;
          i < (shape as CANNON.ConvexPolyhedron).vertices.length;
          i++
        ) {
          const v = (shape as CANNON.ConvexPolyhedron).vertices[i];
          geometry.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
        }

        for (
          let i = 0;
          i < (shape as CANNON.ConvexPolyhedron).faces.length;
          i++
        ) {
          const face = (shape as CANNON.ConvexPolyhedron).faces[i];

          // add triangles
          const a = face[0];
          for (let j = 1; j < face.length - 1; j++) {
            const b = face[j];
            const c = face[j + 1];
            geometry.faces.push(new THREE.Face3(a, b, c));
          }
        }
        geometry.computeBoundingSphere();
        geometry.computeFaceNormals();

        mesh = new THREE.Mesh(geometry, material);
        shape.geometryId = geometry.id;

        //highlight faces that the CONVEXPOLYHEDRON thinks are pointing into the shape.
        geometry.faces.forEach(f => {
          const n = f.normal;
          n.negate();
          f.normal = n;
          const v1 = geometry.vertices[f.a];
          if (n.dot(v1) > 0) {
            const v2 = geometry.vertices[f.b];
            const v3 = geometry.vertices[f.c];

            const p = new THREE.Vector3();
            p.x = (v1.x + v2.x + v3.x) / 3;
            p.y = (v1.y + v2.y + v3.y) / 3;
            p.z = (v1.z + v2.z + v3.z) / 3;

            const g = new THREE.Geometry();
            g.vertices.push(v1, v2, v3);
            g.faces.push(new THREE.Face3(0, 1, 2));
            g.computeFaceNormals();
            const m = new THREE.Mesh(
              g,
              new THREE.MeshBasicMaterial({ color: 0xff0000 })
            );
            mesh.add(m);
          }
        });
        break;

      case CANNON.Shape.types.TRIMESH:
        geometry = new THREE.Geometry();
        v0 = this.tmpVec0;
        v1 = this.tmpVec1;
        v2 = this.tmpVec2;
        for (let i = 0; i < (shape as CANNON.Trimesh).indices.length / 3; i++) {
          (shape as CANNON.Trimesh).getTriangleVertices(i, v0, v1, v2);
          geometry.vertices.push(
            new THREE.Vector3(v0.x, v0.y, v0.z),
            new THREE.Vector3(v1.x, v1.y, v1.z),
            new THREE.Vector3(v2.x, v2.y, v2.z)
          );
          let j = geometry.vertices.length - 3;
          geometry.faces.push(new THREE.Face3(j, j + 1, j + 2));
        }
        geometry.computeBoundingSphere();
        geometry.computeFaceNormals();
        mesh = new THREE.Mesh(geometry, material);
        shape.geometryId = geometry.id;
        break;

      case CANNON.Shape.types.HEIGHTFIELD:
        geometry = new THREE.Geometry();

        v0 = this.tmpVec0;
        v1 = this.tmpVec1;
        v2 = this.tmpVec2;
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
              (shape as CANNON.Heightfield).getConvexTrianglePillar(
                xi,
                yi,
                k === 0
              );
              v0.copy((shape as CANNON.Heightfield).pillarConvex.vertices[0]);
              v1.copy((shape as CANNON.Heightfield).pillarConvex.vertices[1]);
              v2.copy((shape as CANNON.Heightfield).pillarConvex.vertices[2]);
              v0.vadd((shape as CANNON.Heightfield).pillarOffset, v0);
              v1.vadd((shape as CANNON.Heightfield).pillarOffset, v1);
              v2.vadd((shape as CANNON.Heightfield).pillarOffset, v2);
              geometry.vertices.push(
                new THREE.Vector3(v0.x, v0.y, v0.z),
                new THREE.Vector3(v1.x, v1.y, v1.z),
                new THREE.Vector3(v2.x, v2.y, v2.z)
              );
              const i = geometry.vertices.length - 3;
              geometry.faces.push(new THREE.Face3(i, i + 1, i + 2));
            }
          }
        }
        geometry.computeBoundingSphere();
        geometry.computeFaceNormals();
        mesh = new THREE.Mesh(geometry, material);
        shape.geometryId = geometry.id;
        break;
    }

    if (mesh) {
      this.scene.add(mesh);
    }

    return mesh;
  }

  private _scaleMesh(mesh: THREE.Mesh | THREE.Points, shape: CANNON.Shape) {
    switch (shape.type) {
      case CANNON.Shape.types.SPHERE:
        const radius = (shape as CANNON.Sphere).radius;
        mesh.scale.set(radius, radius, radius);
        break;

      case CANNON.Shape.types.BOX:
        const halfExtents: CANNON.Vec3 = (shape as CANNON.Box).halfExtents;
        mesh.scale.copy(
          new THREE.Vector3(halfExtents.x, halfExtents.y, halfExtents.z)
        );
        mesh.scale.multiplyScalar(2);
        break;

      case CANNON.Shape.types.CONVEXPOLYHEDRON:
        mesh.scale.set(1, 1, 1);
        break;

      case CANNON.Shape.types.TRIMESH:
        const scale: CANNON.Vec3 = (shape as CANNON.Trimesh).scale;
        mesh.scale.copy(new THREE.Vector3(scale.x, scale.y, scale.z));
        break;

      case CANNON.Shape.types.HEIGHTFIELD:
        mesh.scale.set(1, 1, 1);
        break;
    }
  }
}