import * as THREE from 'three';
import KeyboardState from '../libs/util/KeyboardState.js'
import {
    initRenderer,
    onWindowResize
} from "../libs/util/util.js";
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import { VoxelTransformer } from './components/VoxelTransformer.js';
import { VOXEL_SIZE, EXEC_AXIS_VOXEL_COUNT, MATERIAL, TREE_SLOTS } from './global/constants.js';
import { VoxelMaterial } from './components/material.js';

let scene, renderer, camera, keyboard;
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer("#add9e6");    // View function in util/utils
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);
keyboard = new KeyboardState();

const planeGeometry = new THREE.PlaneGeometry(VOXEL_SIZE * EXEC_AXIS_VOXEL_COUNT, VOXEL_SIZE * EXEC_AXIS_VOXEL_COUNT);
const planeMaterial = new THREE.MeshBasicMaterial(VoxelMaterial.catalog[MATERIAL.EXEC_FLOOR_0]);

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

function createVoxel(x, y, z, key) {
    const voxelGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
    const voxelMeshMaterial = VoxelMaterial.getMeshMaterial(key);
    const voxelMesh = new THREE.Mesh(voxelGeometry, voxelMeshMaterial);

    voxelMesh.position.set(x, y, z);
    scene.add(voxelMesh);
}

// Temp
const gridHelper = new THREE.GridHelper(VOXEL_SIZE * EXEC_AXIS_VOXEL_COUNT, EXEC_AXIS_VOXEL_COUNT, 0x444444, 0x888888);
scene.add(gridHelper);

async function addTree(treeKey, mapPosition) {
    const response = await fetch(`./assets/trees/${treeKey}.json`);
    const tree1VoxelList = await response.json();
    tree1VoxelList.forEach(({ gridX, gridY, gridZ, materialKey }) => {
        const x = VoxelTransformer.transformVoxelCoordinate(mapPosition.x + gridX, false);
        const y = VoxelTransformer.transformVoxelCoordinate(mapPosition.y + gridY);
        const z = VoxelTransformer.transformVoxelCoordinate(mapPosition.z + gridZ, false);
        createVoxel(x, y, z, materialKey);
    });
}

function drawXAxis(minX, maxX, y, z, matKey) {
    for (let x = minX; x <= maxX; x++) {
        createVoxel(
            VoxelTransformer.transformVoxelCoordinate(x, false),
            VoxelTransformer.transformVoxelCoordinate(y),
            VoxelTransformer.transformVoxelCoordinate(z, false),
            matKey
        );
    }

}

function renderValley() {
    let leftStartX = - Math.floor(EXEC_AXIS_VOXEL_COUNT / 7);
    let rightStartX = Math.floor(EXEC_AXIS_VOXEL_COUNT / 7);
    const startZ = - Math.floor(EXEC_AXIS_VOXEL_COUNT / 2);
    const endZ = Math.floor(EXEC_AXIS_VOXEL_COUNT / 2);
    const xMin = - Math.floor(EXEC_AXIS_VOXEL_COUNT / 2);
    const xMax = Math.floor(EXEC_AXIS_VOXEL_COUNT / 2);

    for (let z = startZ; z <= endZ; z++) {
        const variation = Math.cos(z / 8) * 3;
        // Renderiza o lado esquerdo do primeiro nível
        drawXAxis(xMin, leftStartX + Math.round(variation), 0, z, MATERIAL.EXEC_FLOOR_1);
        // Renderiza o lado direito do primeiro nível.
        drawXAxis(rightStartX + Math.round(variation), xMax, 0, z, MATERIAL.EXEC_FLOOR_1);
    }

    leftStartX = - Math.floor(EXEC_AXIS_VOXEL_COUNT / 3.5);
    rightStartX = Math.floor(EXEC_AXIS_VOXEL_COUNT / 3.5);
    for (let z = startZ; z <= endZ; z++) {
        let variation = Math.cos(z / 5) * 2;
        // Renderiza o lado esquerdo do segundo nível
        drawXAxis(xMin, leftStartX + Math.round(variation), 1, z, MATERIAL.EXEC_FLOOR_2);

        variation = Math.cos(z / 10) * 3;
        // Renderiza o lado direito do segundo nível
        drawXAxis(rightStartX + Math.round(variation), xMax, 1, z, MATERIAL.EXEC_FLOOR_2);
    }

    // Prencheer os slots das árvores.
    TREE_SLOTS.forEach(({ tree, position }) => addTree(tree, position));
}

// Main camera
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.copy(camPos);
camera.up.copy(camUp);
camera.lookAt(camLook);
var controls = new OrbitControls(camera, renderer.domElement);

renderValley();
render();

function render() {
    requestAnimationFrame(render);
    // keyboardUpdate();  
    renderer.render(scene, camera);
}