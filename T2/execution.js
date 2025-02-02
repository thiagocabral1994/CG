import * as THREE from 'three';
import KeyboardState from '../libs/util/KeyboardState.js'
import {
    initRenderer,
    initDefaultBasicLight,
    onWindowResize,
    getMaxSize,
} from "../libs/util/util.js";
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import { PointerLockOrbitControls } from './util/PointerLockOrbitControls.js';
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

function getTerrainHeight(x, z) {
    const scale = 20;
    const smootheness = 40;
    const perlinOffset = 0.50;
    const heightMultiplier = terrainHeightPerlin.get((x / smootheness), (z / smootheness));

    let heightValue = (heightMultiplier + perlinOffset) * scale;
    if (heightValue > 20) {
        heightValue = 20;
    } else if (heightValue < 0) {
        heightValue = 0;
    }

    return Math.floor(heightValue);
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

// Orbital camera
const camUp = new THREE.Vector3(0.0, 1.0, 0.0);

const orbitalCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
orbitalCamera.position.copy(new THREE.Vector3(20 * VOXEL_SIZE, 20 * VOXEL_SIZE, 46 * VOXEL_SIZE));
orbitalCamera.up.copy(camUp);
orbitalCamera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
const orbitalControls = new OrbitControls(orbitalCamera, renderer.domElement);

const firstPersonCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const characterPosition = new THREE.Vector3(VOXEL_SIZE / 2, VoxelTransformer.transformVoxelCoordinate(getTerrainHeight(0, 0)) + 3 * (VOXEL_SIZE / 2), VOXEL_SIZE / 2);
firstPersonCamera.position.set(characterPosition.x - (5 * VOXEL_SIZE), characterPosition.y + 3 * (VOXEL_SIZE / 2), characterPosition.z);
firstPersonCamera.up.copy(camUp);
firstPersonCamera.lookAt(characterPosition);
const firstPersonControls = new PointerLockOrbitControls(firstPersonCamera, renderer.domElement);
firstPersonControls.enableZoom = false;
firstPersonControls.enablePan = false;
firstPersonControls.maxPolarAngle = Math.PI / 2;

let characterMesh;
let characterAnimationMixer = Array();

loadGLTFFile('./assets/character/steve.glb', characterPosition);
// Finish Importação de arquivo 

function loadGLTFFile(modelName, position) {
    var loader = new GLTFLoader();
    loader.load(modelName, function (gltf) {
        var obj = gltf.scene;
        obj.traverse(function (child) {
            if (child.isMesh) child.castShadow = true;
            if (child.material) child.material.side = THREE.DoubleSide;
        });

        // Only fix the position of the centered object
        // The man around will have a different geometric transformation
        obj.position.copy(position);
        var scale = getMaxSize(obj); // Available in 'utils.js'
        obj.scale.set(VOXEL_SIZE * (0.7 / scale), VOXEL_SIZE * (0.7 / scale), VOXEL_SIZE * (0.7 / scale));
        characterMesh = obj;
        firstPersonControls.target.copy(characterMesh.position);
        scene.add(obj);

        // Create animationMixer and push it in the array of mixers
        var mixerLocal = new THREE.AnimationMixer(obj);
        mixerLocal.clipAction(gltf.animations[0]).play();
        characterAnimationMixer.push(mixerLocal);
    }, onProgress, onError);
}

function onError() { };

function onProgress(xhr, model) { }

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
            firstPersonControls.enabled = true;
        } else {
            firstPersonControls.unlock();
            orbitalControls.enabled = true;
            firstPersonControls.enabled = false;
            // Isso é necessário para evitar um estado intermediário onde o usuário não consegue orbitar a câmera até apertar a tecla ESC.
            document.exitPointerLock();
        }
    }
});

document.addEventListener('pointerlockchange', () => {
    isFirstPersonCamera = firstPersonControls.isLocked;
    if(firstPersonControls.isLocked) {
        firstPersonControls.lock();
        firstPersonControls.enabled = true;
    } else {
        orbitalControls.enabled = true;
        firstPersonControls.enabled = false;
    }
})

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

function adjustQuaternionAxis() {
    // Extract the Y-axis rotation from the camera's quaternion
    const euler = new THREE.Euler(0, 0, 0, 'YXZ'); // YXZ order ensures proper extraction
    euler.setFromQuaternion(firstPersonCamera.quaternion);

    // Apply only the Y rotation to the character
    characterMesh?.rotation.set(0, euler.y + Math.PI, 0); // + Math.PI to face opposite direction
}

function moveCharacterForward(distance) {
    const direction = new THREE.Vector3(0, 0, -1); // Default forward direction in local space
    const quaternion = new THREE.Quaternion();
    
    // Extract rotation from the camera
    firstPersonCamera.getWorldQuaternion(quaternion);
    
    // Rotate the direction by the camera's quaternion
    direction.applyQuaternion(quaternion);
    
    // Move only in the XZ plane (ignore Y)
    direction.y = 0;
    direction.normalize();
    
    // Apply movement
    characterMesh.position.addScaledVector(direction, distance);
    firstPersonControls.target.copy(characterMesh.position);
    firstPersonCamera.position.addScaledVector(direction, distance);
}

function moveCharacterRight(distance) {
    const direction = new THREE.Vector3(1, 0, 0); // Default forward direction in local space
    const quaternion = new THREE.Quaternion();
    
    // Extract rotation from the camera
    firstPersonCamera.getWorldQuaternion(quaternion);
    
    // Rotate the direction by the camera's quaternion
    direction.applyQuaternion(quaternion);
    
    // Move only in the XZ plane (ignore Y)
    direction.y = 0;
    direction.normalize();
    
    // Apply movement
    characterMesh.position.addScaledVector(direction, distance);
    firstPersonControls.target.copy(characterMesh.position);
    firstPersonCamera.position.addScaledVector(direction, distance);
}

function moveAnimate(delta) {
    adjustQuaternionAxis();
    const distance = speed * delta;

    if (!moveForward && !moveBackward && !moveRight && !moveLeft) {
        // Vamos setar o idle state
        characterAnimationMixer[0].setTime(2);
    } else {
        // Vamos manter o personagem em animação de movimento
        characterAnimationMixer[0].update(delta);
    }

    if (moveForward) {
        moveCharacterForward(distance);
    }
    else if (moveBackward) {
        moveCharacterForward(distance * -1);
    }
    if (moveRight) {
        moveCharacterRight(distance);
    }
    else if (moveLeft) {
        moveCharacterRight(distance * -1);
    }

    // adjustCharacterPosition();
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