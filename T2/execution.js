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
import { VOXEL_SIZE, EXEC_AXIS_VOXEL_COUNT, MATERIAL, TREE_SLOTS, TREE } from './global/constants.js';
import { VoxelMaterial } from './components/material.js';
import createPerlin from './util/perlin.js'

let scene, renderer, light, keyboard;
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer("#add9e6");    // View function in util/utils
light = initDefaultBasicLight(scene);
keyboard = new KeyboardState();

const terrainHeightPerlin = createPerlin();
const terrainTypePerlin = createPerlin();
const treeDistributionPerlin = createPerlin();

//scene.fog = new THREE.Fog( 0xcccccc, 10, 100);

function createBatchVoxel(matKey, count) {
    const voxelGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
    const voxelMeshMaterial = VoxelMaterial.getMeshMaterial(matKey);
    const instancedMesh = new THREE.InstancedMesh(voxelGeometry, voxelMeshMaterial, count);
    scene.add(instancedMesh);
    return instancedMesh;
}

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

function placeVoxelInValley(payload, x, y, z) {
    const { matrixes, count } = payload;

    matrixes[count] = new THREE.Matrix4()
    matrixes[count].setPosition(
        VoxelTransformer.transformVoxelCoordinate(x, false),
        VoxelTransformer.transformVoxelCoordinate(y),
        VoxelTransformer.transformVoxelCoordinate(z, false),
    );
    payload.count++;
}

function updateInstanceMeshes(payload) {
    const instanceMesh = createBatchVoxel(payload.key, payload.matrixes.length);
    for (let j = 0; j < payload.matrixes.length; j++) {
        instanceMesh.setMatrixAt(j, payload.matrixes[j])
    }
}

function renderValley() {
    const scale = 20;
    const smootheness = 40;
    const perlinOffset = 0.50;
    
    const grassPayload = { matrixes: [], count: 0, key: MATERIAL.GRASS };
    const sandPayload = { matrixes: [], count: 0, key: MATERIAL.SAND };
    const stonePayload = { matrixes: [], count: 0, key: MATERIAL.STONE };
    const treePositions = [];

    for (let x = - (EXEC_AXIS_VOXEL_COUNT / 2); x < (EXEC_AXIS_VOXEL_COUNT / 2); x++) {
        for (let z = -(EXEC_AXIS_VOXEL_COUNT / 2); z < (EXEC_AXIS_VOXEL_COUNT / 2); z++) {
            const heightMultiplier = terrainHeightPerlin.get((x / smootheness), (z / smootheness));

            let heightValue = (heightMultiplier + perlinOffset) * scale;
            if (heightValue > 20) {
                heightValue = 20;
            } else if (heightValue < 0) {
                heightValue = 0;
            }

            const typeMultiplier = terrainTypePerlin.get((x / smootheness), (z / smootheness));

            let selectedPayload = grassPayload;
            if (typeMultiplier > 0.3) {
                selectedPayload = sandPayload;
            } else if (typeMultiplier < - 0.3) {
                selectedPayload = stonePayload;
            }

            const treeRandom = (1 - Math.random()) * 100;
            if (
                treeRandom <= 1 && 
                selectedPayload.key === MATERIAL.GRASS &&
                Math.floor(heightValue) > 3
            ) {
                const nextTreeMatrix = new THREE.Vector3(x, Math.floor(heightValue) + 1, z);
                const hasTreeNearby = treePositions.some(position =>
                    Math.abs(x - position.x) < 10 &&
                    Math.abs(z - position.z) < 10
                );
                if (!hasTreeNearby) {
                    treePositions.push(nextTreeMatrix);
                }
            }

            if (
                x != - (EXEC_AXIS_VOXEL_COUNT / 2) && 
                x != ((EXEC_AXIS_VOXEL_COUNT / 2) - 1) &&
                z != - (EXEC_AXIS_VOXEL_COUNT / 2) &&
                z != ((EXEC_AXIS_VOXEL_COUNT / 2) - 1)
            ) {
                const roundedHeight = Math.floor(heightValue);
                // Criamos o voxel pra superfície
                placeVoxelInValley(roundedHeight > 2 ? selectedPayload : stonePayload, x, roundedHeight, z);
                // E criamos o voxel para o fundo
                placeVoxelInValley(stonePayload, x, 0, z);
            } else {
                for (let y = 0; y <= Math.floor(heightValue); y++) {
                    placeVoxelInValley(y > 2 ? selectedPayload : stonePayload, x, y, z);
                }
            }
        }
    }

    updateInstanceMeshes(stonePayload);
    updateInstanceMeshes(grassPayload);
    updateInstanceMeshes(sandPayload);

    const promises = treePositions.map(position => {
        const treeValues = Object.values(TREE);
        const randomKey = treeValues[Math.floor(Math.random() * treeValues.length)];
        addTree(randomKey, position);
    });

    return Promise.resolve(promises);
}

function renderValley2() {
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