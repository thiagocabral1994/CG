import * as THREE from 'three';
import KeyboardState from '../libs/util/KeyboardState.js'
import {
   initRenderer,
   onWindowResize
} from "../libs/util/util.js";


let scene, renderer, camera, keyboard;
const voxelMap = new Map();
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer("#f0f0f0");    // View function in util/utils
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);
keyboard = new KeyboardState();

const VOXEL_SIZE = 5;
const VOXEL_COUNT = 15;

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


let camPos = new THREE.Vector3(0, 5 * VOXEL_SIZE, 11 * VOXEL_SIZE);
let camUp = new THREE.Vector3(0.0, 1.0, 0.0);
let camLook = new THREE.Vector3(0.0, 0.0, 0.0);

let activeMaterialIndex = 0;

const materials = [
   { color: 'green' }, 
   { color: 'red' }, 
   { color: 'blue' },
   { color: '#D2B48C' },
   { color: 'purple' },
];

function getVoxelMeshMaterial(index) {
   return new THREE.MeshBasicMaterial({ ...materials[index] });
}


//Desenha nivel zero
function mapDraw()
{
   debugger;
   console.log("test");
   const position = new THREE.Vector3(0, 0, 0);
      
      //Nível y=0: parte positiva do eixo x
         for(position.x = 0; position.x <= 31; position.x++) 
            {
               for(position.z = -31; position.z <= 31; position.z++)
               {
                  const voxelGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
                  const voxelMeshMaterial = getVoxelMeshMaterial(0);  
                  const voxelMesh = new THREE.Mesh(voxelGeometry, voxelMeshMaterial);
            
                  voxelMap.set(position, voxelMesh);
                  voxelMesh.position.set(position.x, position.y, position.z);
                  scene.add(voxelMesh);
               } 
            } 

       //Nível y=0: parte negativa do eixo x
         for(position.x = 0; position.x >= -31; position.x--) 
            {
                for(position.z = -31; position.z <= 31; position.z++)
                {
                   const voxelGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
                   const voxelMeshMaterial = getVoxelMeshMaterial(0);
                    const voxelMesh = new THREE.Mesh(voxelGeometry, voxelMeshMaterial);
               
                    voxelMap.set(position, voxelMesh);
                    voxelMesh.position.set(position.x, position.y, position.z);
                  scene.add(voxelMesh);
               } 
            } 

      //Nível y=1: parte positiva do eixo x
      for(position.x = 10; position.x <= 31; position.x++) 
         {
            for(position.z = -31; position.z <= 31; position.z++)
            {
               const voxelGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
               const voxelMeshMaterial = getVoxelMeshMaterial(3); 
               const voxelMesh = new THREE.Mesh(voxelGeometry, voxelMeshMaterial);
         
               voxelMap.set(position, voxelMesh);
               voxelMesh.position.set(position.x, position.y, position.z);
               scene.add(voxelMesh);
            } 
         } 

      //Nível y=1: parte negativa do eixo x
      for(position.x = -10; position.x >= -31; position.x--) 
         {
            for(position.z = -31; position.z <= 31; position.z++)
            {
               const voxelGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
               const voxelMeshMaterial = getVoxelMeshMaterial(3); 
               const voxelMesh = new THREE.Mesh(voxelGeometry, voxelMeshMaterial);
         
               voxelMap.set(position, voxelMesh);
               voxelMesh.position.set(position.x, position.y, position.z);
               scene.add(voxelMesh);
            } 
         } 
}


// Main camera
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.copy(camPos);
camera.up.copy(camUp);
camera.lookAt(camLook);

render();

function render() {
   requestAnimationFrame(render);
   // keyboardUpdate();  
   renderer.render(scene, camera);
   mapDraw();
}