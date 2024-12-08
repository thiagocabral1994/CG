import * as THREE from 'three';
import KeyboardState from '../libs/util/KeyboardState.js'
import {
   initRenderer,
   initDefaultBasicLight,
   onWindowResize
} from "../libs/util/util.js";
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import { VoxelTransformer } from './components/VoxelTransformer.js';
import { BUILDER_AXIS_VOXEL_COUNT, VOXEL_SIZE, MATERIAL, EXPORT_FILENAME } from './global/constants.js';
import { VoxelMaterial } from './components/material.js';
import { VoxelBuilder } from './components/VoxelBuilder.js';

let scene, renderer, camera, light, keyboard;
const voxelMap = new Map();
const heightVoxelMap = new Map();
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer("#f0f0f0");    // View function in util/utils
light = initDefaultBasicLight(scene);
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);
keyboard = new KeyboardState();

const cursorMaterials = [MATERIAL.M1, MATERIAL.M2, MATERIAL.M3, MATERIAL.M4, MATERIAL.M5];

let activeMaterialIndex = 0;

const planeGeometry = new THREE.PlaneGeometry(VOXEL_SIZE * BUILDER_AXIS_VOXEL_COUNT, VOXEL_SIZE * BUILDER_AXIS_VOXEL_COUNT);
const planeMaterial = new THREE.MeshLambertMaterial(VoxelMaterial.catalog[MATERIAL.BUILDER_FLOOR]);

const mat4 = new THREE.Matrix4(); // Aux mat4 matrix   
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
// Rotate 90 in X and perform a small translation in Y
planeMesh.matrixAutoUpdate = false;
planeMesh.matrix.identity(); // resetting matrices
// Will execute R1 and then T1
planeMesh.matrix.multiply(mat4.makeTranslation(0.0, -0.1, 0.0)); // T1   
planeMesh.matrix.multiply(mat4.makeRotationX(-90 * Math.PI / 180)); // R1   
scene.add(planeMesh);

const gridHelper = new THREE.GridHelper(VOXEL_SIZE * BUILDER_AXIS_VOXEL_COUNT, BUILDER_AXIS_VOXEL_COUNT, 0x444444, 0x888888);
scene.add(gridHelper);

// Create objects
const voxelCursorGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
const voxelCursorMaterial = VoxelMaterial.getCursorMeshMaterial(cursorMaterials[activeMaterialIndex]);
const voxelCursorMesh = new THREE.Mesh(voxelCursorGeometry, voxelCursorMaterial);
const voxelCursorWireframeMaterial= VoxelMaterial.getCursorWireframeMaterial();
const voxelCursorWireframeMesh = new THREE.Mesh(voxelCursorGeometry, voxelCursorWireframeMaterial);
voxelCursorMesh.position.set((-5 * VOXEL_SIZE) + VOXEL_SIZE / 2, 0 + VOXEL_SIZE / 2, 0 + VOXEL_SIZE / 2);
voxelCursorWireframeMesh.position.copy(voxelCursorMesh.position);
scene.add(voxelCursorMesh);
scene.add(voxelCursorWireframeMesh);


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

const getKey = (position) => `${position.x},${position.y},${position.z}`;

function addSpheresBelow(position) {
   const { x, y, z } = position;
   for (let i = y; i >= 0; i = i - VOXEL_SIZE) {
      const spherePosition = new THREE.Vector3(x, i, z);
      const sphereKey = getKey(spherePosition);
      if (heightVoxelMap.has(sphereKey) || voxelMap.has(sphereKey)) {
         // Não precisa indicar com a esfera aonde já possui uma representação!
         continue;
      }

      const sphereGeometry = new THREE.SphereGeometry(VOXEL_SIZE / 4, VOXEL_SIZE * 6, VOXEL_SIZE * 3);
      const sphereMaterial = new THREE.MeshLambertMaterial({ color: "black", opacity: 0.10, transparent: true });
      const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphereMesh.position.set(spherePosition.x, spherePosition.y, spherePosition.z);
      heightVoxelMap.set(sphereKey, sphereMesh);
      scene.add(sphereMesh);
   }
}

function removeSpheresBelow(position) {
   const { x, y, z } = position;
   for (let i = y; i >= 0; i = i - VOXEL_SIZE) {
      const spherePosition = new THREE.Vector3(x, i, z);
      const sphereKey = getKey(spherePosition);
      if (voxelMap.has(sphereKey)) {
         // Se encontramos outro Voxel, assumimos que qualquer esfera abaixo pertence a ele e encerramos o loop.
         break;
      }
      const sphereMeshToRemove = heightVoxelMap.get(sphereKey);
      if (sphereMeshToRemove) {
         scene.remove(sphereMeshToRemove);
         heightVoxelMap.delete(sphereKey);
      }
   }
}

function addVoxelToScene(position, materialKey = cursorMaterials[activeMaterialIndex]) {
   const voxelMesh = VoxelBuilder.createVoxelMesh(position, materialKey);
   const key = getKey(position);
   // Precisamos remover a esfera posicionada, caso ela exista!
   const sphereMesh = heightVoxelMap.get(key);
   if (sphereMesh) {
      scene.remove(sphereMesh);
      heightVoxelMap.delete(key);
   }
   voxelMap.set(getKey(position), {
      mesh: voxelMesh,
      materialKey,
   });
   scene.add(voxelMesh);
   addSpheresBelow(voxelMesh.position);
}

function clearAllMappedVoxels() {
   voxelMap.entries().forEach(([key, data]) => {
      const { mesh } = data;
      scene.remove(mesh);
      voxelMap.delete(key);
   });
   heightVoxelMap.entries().forEach(([key, mesh]) => {
      scene.remove(mesh);
      heightVoxelMap.delete(key);
   });
}

function removeVoxelFromScene(position) {
   const { x, y, z } = position;
      const cursorKey = getKey(position);
      const voxelToRemove = voxelMap.get(cursorKey);
      if (voxelToRemove) {
         scene.remove(voxelToRemove.mesh);
         voxelMap.delete(cursorKey);
         const abovePosition = new THREE.Vector3(x, y + VOXEL_SIZE, z);
         const aboveKey = getKey(abovePosition);
         // Precisamos decidir se ainda há um voxel acima ou não.
         // Caso haja, precisamos completar as esferas.
         // Caso não haja, podemos remover as esferas embaixo subsequentes.
         if (heightVoxelMap.has(aboveKey) || voxelMap.has(aboveKey)) {
            addSpheresBelow(abovePosition);
         } else {
            removeSpheresBelow(position)
         }
      }
}

function keyboardUpdate() {
   keyboard.update();

   if (keyboard.down("Q") && !voxelMap.has(getKey(voxelCursorMesh.position))) {
      addVoxelToScene(voxelCursorMesh.position);
   }

   if (keyboard.down("E")) {
      removeVoxelFromScene(voxelCursorMesh.position);
   }

   if (keyboard.down("right") && voxelCursorMesh.position.x < (((BUILDER_AXIS_VOXEL_COUNT / 2) - 1) * VOXEL_SIZE) + VOXEL_SIZE / 2) {
      voxelCursorMesh.position.x += VOXEL_SIZE;
   }

   if (keyboard.down("left") && voxelCursorMesh.position.x > (-(BUILDER_AXIS_VOXEL_COUNT / 2) * VOXEL_SIZE) + VOXEL_SIZE / 2) {
      voxelCursorMesh.position.x -= VOXEL_SIZE;
   }

   if (keyboard.down("down") && voxelCursorMesh.position.z < (((BUILDER_AXIS_VOXEL_COUNT / 2) - 1) * VOXEL_SIZE) + VOXEL_SIZE / 2) {
      voxelCursorMesh.position.z += VOXEL_SIZE;
   }

   if (keyboard.down("up") && voxelCursorMesh.position.z > (-(BUILDER_AXIS_VOXEL_COUNT / 2) * VOXEL_SIZE) + VOXEL_SIZE / 2) {
      voxelCursorMesh.position.z -= VOXEL_SIZE;
   }

   if (keyboard.down("pageup") /* && voxelCursorMesh.position.y < (((BUILDER_AXIS_VOXEL_COUNT / 2) - 1) * VOXEL_SIZE) + VOXEL_SIZE / 2 */) {
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
      voxelCursorMesh.material = VoxelMaterial.getCursorMeshMaterial(cursorMaterials[activeMaterialIndex]);
   }

   if (keyboard.down(".")) {
      activeMaterialIndex = activeMaterialIndex < cursorMaterials.length - 1 ? activeMaterialIndex + 1 : 0;
      voxelCursorMesh.material = VoxelMaterial.getCursorMeshMaterial(cursorMaterials[activeMaterialIndex]);
   }
   // reseta camera apertando R
   if (keyboard.down("R")) {
      camera.position.copy(initialCamPos);
      camera.up.copy(initialCamUp);
      camera.lookAt(initialCamLook);
      controls.reset();
      gridHelper.position.y = 0;
      voxelCursorMesh.position.y = VOXEL_SIZE/2;
   }

   // Independente da posição do cursor, o wireframe deve ser atualizado para estar na mesma posição.
   voxelCursorWireframeMesh.position.copy(voxelCursorMesh.position);
}

function render() {
   requestAnimationFrame(render);
   keyboardUpdate();
   renderer.render(scene, camera);
}

function getLoadInput() {
   return document.getElementById('loadFileName');
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

document.getElementById('save-file-form').addEventListener('submit', function (event) {
   // Importante para a página não recarregar
   event.preventDefault();

   const positionedVoxelList = [];
   voxelMap.forEach(({ mesh, materialKey }) => {
      positionedVoxelList.push({
         gridX: VoxelTransformer.transformGridCoordinate(mesh.position.x),
         gridY: VoxelTransformer.transformGridCoordinate(mesh.position.y),
         gridZ: VoxelTransformer.transformGridCoordinate(mesh.position.z),
         materialKey,
      });
   });

   if (positionedVoxelList.length === 0) {
      alert('Não foi possível baixar o modelo pois nenhum voxel foi adicionado!');
      return;
   }

   downloadObject(positionedVoxelList, EXPORT_FILENAME);
});



document.getElementById('load-file-form').addEventListener('submit', function (event) {
   // Importante para a página não recarregar
   event.preventDefault();

   const input = getLoadInput();
   const file = input.files[0];

   if (file && file.type === 'application/json') {
      const reader = new FileReader();

      reader.onload = function (e) {
         try {
            const jsonData = JSON.parse(e.target.result);
            if (Array.isArray(jsonData)) {
               clearAllMappedVoxels();
               jsonData.forEach((voxelSchema) => {
                  const { gridX, gridY, gridZ, materialKey } = voxelSchema;
                  const x = VoxelTransformer.transformVoxelCoordinate(gridX);
                  const y = VoxelTransformer.transformVoxelCoordinate(gridY);
                  const z = VoxelTransformer.transformVoxelCoordinate(gridZ);
                  const schemaScalarPosition = new THREE.Vector3(x, y, z);
                  addVoxelToScene(schemaScalarPosition, materialKey);
               });
            } else {
               console.error('Erro no parsing do JSON. Não é uma lista!', jsonData);
               alert('JSON inserido não é uma lista!');
            }
         } catch (error) {
            console.error('Erro no parsing do JSON:', error);
            alert('Erro ao ler JSON! (Verifique o console do navegador)');
         }
      };

      // Read the file as text (UTF-8)
      reader.readAsText(file);
      input.value = '';
   } else {
      alert('Arquivo não possui uma extensão de JSON!');
   }
});