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
renderer = initRenderer("#add9e6");    // View function in util/utils
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);
keyboard = new KeyboardState();

const VOXEL_SIZE = 5;
const VOXEL_COUNT = 15;

const planeGeometry = new THREE.PlaneGeometry(VOXEL_SIZE * VOXEL_COUNT, VOXEL_SIZE * VOXEL_COUNT);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 'green' });

const mat4 = new THREE.Matrix4(); // Aux mat4 matrix   
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
// Rotate 90 in X and perform a small translation in Y
planeMesh.matrixAutoUpdate = false;
planeMesh.matrix.identity(); // resetting matrices
// Will execute R1 and then T1
planeMesh.matrix.multiply(mat4.makeTranslation(0.0, -0.1, 0.0)); // T1   
planeMesh.matrix.multiply(mat4.makeRotationX(-90 * Math.PI / 180)); // R1   
scene.add(planeMesh);


let camPos = new THREE.Vector3(0, 5 * VOXEL_SIZE, 11 * VOXEL_SIZE);
let camUp = new THREE.Vector3(0.0, 1.0, 0.0);
let camLook = new THREE.Vector3(0.0, 0.0, 0.0);




let activeMaterialIndex = 0;

const materials = [
   { color: 'green' }, 
   { color: 'red' }, 
   { color: 'blue' },
   { color: 'white' },
   { color: '#D2B48C' },
];

function getVoxelMeshMaterial(index) {
   return new THREE.MeshBasicMaterial({ ...materials[index] });
}

function createVoxel(x, y, z, c)
{
   const position = new THREE.Vector3(x, y, z);
   const voxelGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
   const voxelMeshMaterial = getVoxelMeshMaterial(c); 
   const voxelMesh = new THREE.Mesh(voxelGeometry, voxelMeshMaterial);

   voxelMesh.position.set(x, y, z);
   scene.add(voxelMesh);
}

function mapDraw() {
    let leftStartX = -10; 
    let rightStartX = 10; 
    const startZ = -31; 
    const endZ = 31; 
    const xMin = -31; 
    const xMax = 31; 

    for (let z = startZ; z <= endZ; z++) {
        const variation = Math.sin(z / 10) * 5; 

        for (let x = xMin; x <= leftStartX + Math.round(variation); x++) {
            createVoxel(x, 2.5, z, 4); 
        }

        
        for (let x = rightStartX + Math.round(variation); x <= xMax; x++) {
            createVoxel(x, 2.5, z, 4); 
        }
    }

     leftStartX = -28; 
     rightStartX = 28; 
    for (let z = startZ; z <= endZ; z++) {
      const variation = Math.sin(z / 10) * 2; 

     
      for (let x = xMin; x <= leftStartX + Math.round(variation); x++) {
          createVoxel(x, 7.5, z, 3); 
      }

     
      for (let x = rightStartX + Math.round(variation); x <= xMax; x++) {
          createVoxel(x, 7.5, z, 3); 
      }
   }
  }

// Main camera
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.copy(camPos);
camera.up.copy(camUp);
camera.lookAt(camLook);
var controls = new OrbitControls(camera, renderer.domElement);

mapDraw();
render();

function render() {
   requestAnimationFrame(render);
   // keyboardUpdate();  
   renderer.render(scene, camera);
}