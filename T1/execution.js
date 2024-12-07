import * as THREE from 'three';
import KeyboardState from '../libs/util/KeyboardState.js'
import {
    initRenderer,
    initDefaultBasicLight,
    onWindowResize
} from "../libs/util/util.js";
import { PointerLockControls } from '../build/jsm/controls/PointerLockControls.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import { VoxelTransformer } from './components/VoxelTransformer.js';
import { VOXEL_SIZE, EXEC_AXIS_VOXEL_COUNT, MATERIAL, TREE_SLOTS } from './global/constants.js';
import { VoxelMaterial } from './components/material.js';

let scene, renderer, light, keyboard;
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer("#add9e6");    // View function in util/utils
light = initDefaultBasicLight(scene);
keyboard = new KeyboardState();

const planeGeometry = new THREE.PlaneGeometry(VOXEL_SIZE * EXEC_AXIS_VOXEL_COUNT, VOXEL_SIZE * EXEC_AXIS_VOXEL_COUNT);
const planeMaterial = new THREE.MeshLambertMaterial(VoxelMaterial.catalog[MATERIAL.EXEC_FLOOR_0]);

const mat4 = new THREE.Matrix4(); // Aux mat4 matrix   
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
// Rotate 90 in X and perform a small translation in Y
planeMesh.matrixAutoUpdate = false;
planeMesh.matrix.identity(); // resetting matrices
// Will execute R1 and then T1
planeMesh.matrix.multiply(mat4.makeTranslation(0.0, -0.1, 0.0)); // T1   
planeMesh.matrix.multiply(mat4.makeRotationX(-90 * Math.PI / 180)); // R1   
scene.add(planeMesh);

function createVoxel(x, y, z, key) {
    const voxelGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
    const voxelMeshMaterial = VoxelMaterial.getMeshMaterial(key);
    const voxelMesh = new THREE.Mesh(voxelGeometry, voxelMeshMaterial);

    voxelMesh.position.set(x, y, z);
    scene.add(voxelMesh);
}

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
    const promises = TREE_SLOTS.map(({ tree, position }) => addTree(tree, position));
    return Promise.all(promises);
}

// Orbital camera
const camUp = new THREE.Vector3(0.0, 1.0, 0.0);

const orbitalCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
orbitalCamera.position.copy(new THREE.Vector3(20 * VOXEL_SIZE, 20 * VOXEL_SIZE, 46 * VOXEL_SIZE));
orbitalCamera.up.copy(camUp);
orbitalCamera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
const orbitalControls = new OrbitControls(orbitalCamera, renderer.domElement);

const firstPersonCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
firstPersonCamera.position.copy(new THREE.Vector3(0, VOXEL_SIZE / 2, 0));
firstPersonCamera.up.copy(camUp);
firstPersonCamera.lookAt(new THREE.Vector3(VOXEL_SIZE, VOXEL_SIZE / 2, VOXEL_SIZE));
const firstPersonControls = new PointerLockControls(firstPersonCamera, renderer.domElement);
scene.add(firstPersonControls.getObject())


window.addEventListener('resize', function () { onWindowResize(orbitalCamera, renderer) }, false);
window.addEventListener('resize', function () { onWindowResize(firstPersonCamera, renderer) }, false);

let isFirstPersonCamera = false;

// swith between cameras
window.addEventListener('keydown', (event) => {
    if (event.key === 'c') { // C 
        isFirstPersonCamera = !isFirstPersonCamera;
        if (isFirstPersonCamera) {
            firstPersonControls.lock();
            orbitalControls.enabled = false;
        } else {
            firstPersonControls.unlock();
            orbitalControls.enabled = true;
            // Isso é necessário para evitar um estado intermediário onde o usuário não consegue orbitar a câmera até apertar a tecla ESC.
            document.exitPointerLock();
        }
    }
});

// movement controls
const speed = 20;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

window.addEventListener('keydown', (event) => movementControls(event.key, true));
window.addEventListener('keyup', (event) => movementControls(event.key, false));
document.getElementById('webgl-output').addEventListener('click', function () {
    if (isFirstPersonCamera && !firstPersonControls.isLocked) {
        firstPersonControls.lock();
    }
}, false);

function movementControls(key, value) {
    switch (key) {
        case 'w':
            moveForward = value;
            break; // W
        case 's':
            moveBackward = value;
            break; // S
        case 'a':
            moveLeft = value;
            break; // A
        case 'd':
            moveRight = value;
            break; // D
    }
}

function moveAnimate(delta) {
    if (moveForward) {
        firstPersonControls.moveForward(speed * delta);
    }
    else if (moveBackward) {
        firstPersonControls.moveForward(speed * -1 * delta);
    }

    if (moveRight) {
        firstPersonControls.moveRight(speed * delta);
    }
    else if (moveLeft) {
        firstPersonControls.moveRight(speed * -1 * delta);
    }
}

renderValley().then(() => {
    // Esperamos carregar todas as árvores antes de renderizar o mapa.
    render();
});

const clock = new THREE.Clock();
function render() {
    requestAnimationFrame(render);

    if (firstPersonControls.isLocked) {
        moveAnimate(clock.getDelta());
    }

    renderer.render(scene, isFirstPersonCamera ? firstPersonCamera : orbitalCamera);
}