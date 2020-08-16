import * as THREE from '/build/three.module.js';
import { OrbitControls } from '/jsm/controls/OrbitControls';
import Stats from '/jsm/libs/stats.module';
import CSG from './utils/CSGMesh.js';
const scene = new THREE.Scene();
var light1 = new THREE.SpotLight();
light1.position.set(2.5, 5, 5);
light1.angle = Math.PI / 4;
light1.penumbra = 0.5;
light1.castShadow = true;
light1.shadow.mapSize.width = 1024;
light1.shadow.mapSize.height = 1024;
light1.shadow.camera.near = 0.5;
light1.shadow.camera.far = 20;
scene.add(light1);
var light2 = new THREE.SpotLight();
light2.position.set(-2.5, 5, 5);
light2.angle = Math.PI / 4;
light2.penumbra = 0.5;
light2.castShadow = true;
light2.shadow.mapSize.width = 1024;
light2.shadow.mapSize.height = 1024;
light2.shadow.camera.near = 0.5;
light2.shadow.camera.far = 20;
scene.add(light2);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = .5;
camera.position.y = 2;
camera.position.z = 2.5;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
const material = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('img/grid.png') });
{
    //create a cube and sphere and intersect them
    const cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshPhongMaterial({ color: 0xff0000 }));
    const sphereMesh = new THREE.Mesh(new THREE.SphereGeometry(1.45, 8, 8), new THREE.MeshPhongMaterial({ color: 0x0000ff }));
    const cylinderMesh1 = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, 2, 8, 1, false), new THREE.MeshPhongMaterial({ color: 0x00ff00 }));
    const cylinderMesh2 = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, 2, 8, 1, false), new THREE.MeshPhongMaterial({ color: 0x00ff00 }));
    const cylinderMesh3 = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, 2, 8, 1, false), new THREE.MeshPhongMaterial({ color: 0x00ff00 }));
    cubeMesh.position.set(-5, 0, -6);
    scene.add(cubeMesh);
    sphereMesh.position.set(-2, 0, -6);
    scene.add(sphereMesh);
    const cubeCSG = CSG.fromMesh(cubeMesh);
    const sphereCSG = CSG.fromMesh(sphereMesh);
    const cubeSphereIntersectCSG = cubeCSG.intersect(sphereCSG);
    const cubeSphereIntersectMesh = CSG.toMesh(cubeSphereIntersectCSG, new THREE.Matrix4());
    cubeSphereIntersectMesh.material = new THREE.MeshPhongMaterial({ color: 0xff00ff });
    cubeSphereIntersectMesh.position.set(-2.5, 0, -3);
    scene.add(cubeSphereIntersectMesh);
    //create 3 cylinders at different rotations and union them
    cylinderMesh1.position.set(1, 0, -6);
    scene.add(cylinderMesh1);
    cylinderMesh2.position.set(3, 0, -6);
    cylinderMesh2.geometry.rotateX(Math.PI / 2);
    scene.add(cylinderMesh2);
    cylinderMesh3.position.set(5, 0, -6);
    cylinderMesh3.geometry.rotateZ(Math.PI / 2);
    scene.add(cylinderMesh3);
    const cylinderCSG1 = CSG.fromMesh(cylinderMesh1);
    const cylinderCSG2 = CSG.fromMesh(cylinderMesh2);
    const cylinderCSG3 = CSG.fromMesh(cylinderMesh3);
    const cylindersUnionCSG = cylinderCSG1.union(cylinderCSG2.union(cylinderCSG3));
    const cylindersUnionMesh = CSG.toMesh(cylindersUnionCSG, new THREE.Matrix4());
    cylindersUnionMesh.material = new THREE.MeshPhongMaterial({ color: 0xffa500 });
    cylindersUnionMesh.position.set(2.5, 0, -3);
    scene.add(cylindersUnionMesh);
    //subtract the cylindersUnionCSG from the cubeSphereIntersectCSG
    const finalCSG = cubeSphereIntersectCSG.subtract(cylindersUnionCSG);
    const finalMesh = CSG.toMesh(finalCSG, new THREE.Matrix4());
    finalMesh.material = material;
    scene.add(finalMesh);
}
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}
const stats = Stats();
document.body.appendChild(stats.dom);
var animate = function () {
    requestAnimationFrame(animate);
    controls.update();
    render();
    stats.update();
};
function render() {
    renderer.render(scene, camera);
}
animate();
