import * as THREE from 'three';
import KeyboardState from '../libs/util/KeyboardState.js'
import {
   initRenderer,
   onWindowResize
} from "../libs/util/util.js";
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';


let scene, renderer, camera, keyboard;
const voxelMap = new Map();
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer("#f0f0f0");    // View function in util/utils
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);
keyboard = new KeyboardState();

const VOXEL_SIZE = 5;
const VOXEL_COUNT = 10;

const materials = [
   { color: 'green' },
   { color: 'red' },
   { color: 'blue' },
   { color: 'yellow' },
   { color: 'purple' },
];

let activeMaterialIndex = 0;

const planeGeometry = new THREE.PlaneGeometry(VOXEL_SIZE * VOXEL_COUNT, VOXEL_SIZE * VOXEL_COUNT);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 'lightblue' });

const mat4 = new THREE.Matrix4(); // Aux mat4 matrix   
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
// Rotate 90 in X and perform a small translation in Y
planeMesh.matrixAutoUpdate = false;
planeMesh.matrix.identity(); // resetting matrices
// Will execute R1 and then T1
planeMesh.matrix.multiply(mat4.makeTranslation(0.0, -0.1, 0.0)); // T1   
planeMesh.matrix.multiply(mat4.makeRotationX(-90 * Math.PI / 180)); // R1   
scene.add(planeMesh);

const gridHelper = new THREE.GridHelper(VOXEL_SIZE * VOXEL_COUNT, VOXEL_COUNT, 0x444444, 0x888888);
scene.add(gridHelper);

function getVoxelCursorMeshMaterial() {
   return new THREE.MeshBasicMaterial({ ...materials[activeMaterialIndex], opacity: 0.5, transparent: true });
}

function getVoxelMeshMaterial() {
   return new THREE.MeshBasicMaterial({ ...materials[activeMaterialIndex] });
}

// Create objects
const voxelCursorGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
const voxelCursorMaterial = getVoxelCursorMeshMaterial();
const voxelCursorMesh = new THREE.Mesh(voxelCursorGeometry, voxelCursorMaterial);
voxelCursorMesh.position.set((-5 * VOXEL_SIZE) + VOXEL_SIZE / 2, 0 + VOXEL_SIZE / 2, 0 + VOXEL_SIZE / 2);
scene.add(voxelCursorMesh);


let camPos = new THREE.Vector3(0, 5 * VOXEL_SIZE, 11 * VOXEL_SIZE);
let camUp = new THREE.Vector3(0.0, 1.0, 0.0);
let camLook = new THREE.Vector3(0.0, 0.0, 0.0);

// Main camera
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.copy(camPos);
camera.up.copy(camUp);
camera.lookAt(camLook);
var controls = new OrbitControls(camera, renderer.domElement);

render();

function keyboardUpdate() {

   keyboard.update();

   if (keyboard.down("Q") && !voxelMap.has(voxelCursorMesh.position)) {
      const { x, y, z } = voxelCursorMesh.position;
      const key = `${x},${y},${z}`;
      if (!voxelMap.has(key)) {
         const voxelGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
         const voxelMeshMaterial = getVoxelMeshMaterial();
         const voxelMesh = new THREE.Mesh(voxelGeometry, voxelMeshMaterial);
   
         voxelMap.set(key, voxelMesh);
         voxelMesh.position.set(x, y, z);
         scene.add(voxelMesh);
      }
   }

   if (keyboard.down("E")) {
      const { x, y, z } = voxelCursorMesh.position;
      const key = `${x},${y},${z}`;
      const voxelMeshToRemove = voxelMap.get(key);
      if (voxelMeshToRemove) {
         scene.remove(voxelMeshToRemove);
         voxelMap.delete(key);
      }
   }

   if (keyboard.down("right") && voxelCursorMesh.position.x < (((VOXEL_COUNT / 2) - 1) * VOXEL_SIZE) + VOXEL_SIZE / 2) {
      voxelCursorMesh.position.x += VOXEL_SIZE;
   }

   if (keyboard.down("left") && voxelCursorMesh.position.x > (-(VOXEL_COUNT / 2) * VOXEL_SIZE) + VOXEL_SIZE / 2) {
      voxelCursorMesh.position.x -= VOXEL_SIZE;
   }

   if (keyboard.down("down") && voxelCursorMesh.position.z < (((VOXEL_COUNT / 2) - 1) * VOXEL_SIZE) + VOXEL_SIZE / 2) {
      voxelCursorMesh.position.z += VOXEL_SIZE;
   }

   if (keyboard.down("up") && voxelCursorMesh.position.z > (-(VOXEL_COUNT / 2) * VOXEL_SIZE) + VOXEL_SIZE / 2) {
      voxelCursorMesh.position.z -= VOXEL_SIZE;
   }

   if (keyboard.down("pageup") && voxelCursorMesh.position.y < (((VOXEL_COUNT / 2) - 1) * VOXEL_SIZE) + VOXEL_SIZE / 2) {
      voxelCursorMesh.position.y += VOXEL_SIZE;
      camera.position.y += VOXEL_SIZE;
      gridHelper.position.y += VOXEL_SIZE;
   }

   if (keyboard.down("pagedown") && voxelCursorMesh.position.y > VOXEL_SIZE) {
      voxelCursorMesh.position.y -= VOXEL_SIZE;
      camera.position.y -= VOXEL_SIZE;
      gridHelper.position.y -= VOXEL_SIZE;
   }

   if (keyboard.down(",")) {
      activeMaterialIndex = activeMaterialIndex > 0 ? activeMaterialIndex - 1 : materials.length - 1;
      voxelCursorMesh.material = getVoxelCursorMeshMaterial();
   }

   if (keyboard.down(".")) {
      activeMaterialIndex = activeMaterialIndex < materials.length - 1 ? activeMaterialIndex + 1 : 0;
      voxelCursorMesh.material = getVoxelCursorMeshMaterial();
   }
}

function render() {
   requestAnimationFrame(render);
   keyboardUpdate();
   renderer.render(scene, camera);
}