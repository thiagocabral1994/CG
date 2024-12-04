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

export const MATERIAL = {
   M1: "M1",
   M2: "M2",
   M3: "M3",
   M4: "M4",
   M5: "M5",
   BUILDER_FLOOR: "BUILDER_FLOOR",
}

const materialCatalog = {
   [MATERIAL.M1]: { color: 'green' },
   [MATERIAL.M2]: { color: 'red' },
   [MATERIAL.M3]: { color: 'blue' },
   [MATERIAL.M4]: { color: 'yellow' },
   [MATERIAL.M5]: { color: 'purple' },
   [MATERIAL.BUILDER_FLOOR]: { color: 'lightblue' },
};

const cursorMaterials = [ MATERIAL.M1, MATERIAL.M2,  MATERIAL.M3, MATERIAL.M4, MATERIAL.M5 ];

let activeMaterialIndex = 0;

const planeGeometry = new THREE.PlaneGeometry(VOXEL_SIZE * VOXEL_COUNT, VOXEL_SIZE * VOXEL_COUNT);
const planeMaterial = new THREE.MeshBasicMaterial(materialCatalog[MATERIAL.BUILDER_FLOOR]);

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
   return new THREE.MeshBasicMaterial({ ...materialCatalog[cursorMaterials[activeMaterialIndex]], opacity: 0.5, transparent: true });
}

function getVoxelMeshMaterial() {
   return new THREE.MeshBasicMaterial({ ...materialCatalog[cursorMaterials[activeMaterialIndex]] });
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

// Armazena posição inicial da camera
const initialCamPos = camPos.clone();
const initialCamUp = camUp.clone();
const initialCamLook = camLook.clone();

// Main camera
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);  
camera.position.copy(camPos);
camera.up.copy(camUp);
camera.lookAt(camLook);
var controls = new OrbitControls(camera, renderer.domElement);

render();

function keyboardUpdate() {

   keyboard.update();

   if (keyboard.down("Q")) {
      const { x, y, z } = voxelCursorMesh.position;
      const key = `${x},${y},${z}`;
      if (!voxelMap.has(key)) {
         const voxelGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
         const voxelMeshMaterial = getVoxelMeshMaterial();
         const voxelMesh = new THREE.Mesh(voxelGeometry, voxelMeshMaterial);
   
         voxelMap.set(key, {
            mesh: voxelMesh,
            materialKey: cursorMaterials[activeMaterialIndex],
         });
         voxelMesh.position.set(x, y, z);
         scene.add(voxelMesh);
      }
   }

   if (keyboard.down("E")) {
      const { x, y, z } = voxelCursorMesh.position;
      const key = `${x},${y},${z}`;
      const voxelToRemove = voxelMap.get(key);
      if (voxelToRemove) {
         scene.remove(voxelToRemove.mesh);
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
      activeMaterialIndex = activeMaterialIndex > 0 ? activeMaterialIndex - 1 : cursorMaterials.length - 1;
      voxelCursorMesh.material = getVoxelCursorMeshMaterial();
   }

   if (keyboard.down(".")) {
      activeMaterialIndex = activeMaterialIndex < cursorMaterials.length - 1 ? activeMaterialIndex + 1 : 0;
      voxelCursorMesh.material = getVoxelCursorMeshMaterial();
   }
   // reseta camera apertando R
   if (keyboard.down("R")) {
      camera.position.copy(initialCamPos); 
      camera.up.copy(initialCamUp);       
      camera.lookAt(initialCamLook);      
      controls.update();                 
   }
}

function render() {
   requestAnimationFrame(render);
   keyboardUpdate();
   renderer.render(scene, camera);
}


// Salvar arquivos
function getSaveFormFileName() {
   return document.getElementById('savefileName').value || 'model.json';
}

/**
 * Cria um blob e realiza o download de um objeto javascript para um arquivo.
 * 
 * @param {object} object 
 * @param {string} fileName 
 */
function downloadObject(object, fileName) {
   const IDENT_SPACES = 2;
   const jsonString = JSON.stringify(object, null, IDENT_SPACES);

   const blob = new Blob([jsonString], { type: 'application/json' });

   const link = document.createElement('a');
   link.href = URL.createObjectURL(blob);
   link.download = fileName;
   link.click();

   // O elemento tipo âncora foi criado artificialmente, então precisamos revogar a URL de download.
   URL.revokeObjectURL(link.href);
}

/**
 * Converte o valor de uma coordenada adicionando a dimensão do voxel
 * 
 * @param {number} baseCoordinate 
 */
function transformVoxelCoordinate(baseCoordinate) {
   return baseCoordinate * VOXEL_SIZE + (VOXEL_SIZE / 2);
}

/**
 * Converte o valor de uma coordenada retirando o valor da dimensão do voxel
 * 
 * @param {number} coordinate 
 */
function transformGridCoordinate(coordinate) {
   return (coordinate - (VOXEL_SIZE / 2)) / VOXEL_SIZE;
}

document.getElementById('save-file-form').addEventListener('submit', function(event) {
   // Importante para a página não recarregar
   event.preventDefault();

   const positionedVoxelList = [];
   voxelMap.forEach(({mesh, materialKey}) => {
      positionedVoxelList.push({
         x: transformGridCoordinate(mesh.position.x),
         y: transformGridCoordinate(mesh.position.y),
         z: transformGridCoordinate(mesh.position.z),
         materialKey,
      });
   });

   const fileName = getSaveFormFileName();
   downloadObject(positionedVoxelList, fileName);
 });

 
document.getElementById('load-file-form').addEventListener('submit', function(event) {
   // Importante para a página não recarregar
   event.preventDefault();

   // TODO
 });