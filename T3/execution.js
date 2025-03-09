import * as THREE from 'three';
import KeyboardState from '../libs/util/KeyboardState.js'
import Stats from '../build/jsm/libs/stats.module.js';
import {
    initRenderer,
    initDefaultBasicLight,
    onWindowResize,
} from "../libs/util/util.js";
import GUI from '../libs/util/dat.gui.module.js'
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import { PointerLockControls } from '../build/jsm/controls/PointerLockControls.js';
import { VoxelTransformer } from './components/VoxelTransformer.js';
import { VOXEL_SIZE, EXEC_AXIS_VOXEL_COUNT, MATERIAL, TREE, WATER_LEVEL } from './global/constants.js';
import { VoxelMaterial } from './components/material.js';
import createPerlin from './util/perlin.js'
import { CubeTextureLoaderSingleFile } from '../libs/util/cubeTextureLoaderSingleFile.js';
import { loadingManager, sound } from './components/loadManager.js';

const terrainHeightPerlin = createPerlin();
const terrainTypePerlin = createPerlin();

var stats = new Stats();

function getBuildingHeight() {
    const scale = 20;
    const smootheness = 40;
    const perlinOffset = 0.50;
    let minHeight = Number.POSITIVE_INFINITY; // Número arbitrário para ser sobrescrito
    for (let x = - 10; x < 10; x++) {
        for (let z = -10; z < 10; z++) {
            const heightMultiplier = terrainHeightPerlin.get((x / smootheness) + 0.01, (z / smootheness) + 0.01);
            const heightValue = (heightMultiplier + perlinOffset) * scale;
            minHeight = heightValue < minHeight ? heightValue : minHeight;
            minHeight = Math.min(minHeight);
            if (minHeight < WATER_LEVEL) {
                // Arbitrário para não ser o nível da água
                minHeight = WATER_LEVEL;
            }
        }
    }
    return minHeight;
}

const buildingHeight = getBuildingHeight();

const getGridPositionKey = (position) => {
    const { x, y, z } = position;
    const calcX = Math.floor(VoxelTransformer.transformGridCoordinate(x, false));
    const calcY = Math.floor(VoxelTransformer.transformGridCoordinate(y));
    const calcZ = Math.floor(VoxelTransformer.transformGridCoordinate(z, false));
    return `${calcX},${calcY},${calcZ}`;
}

function createAmbientLight(power) {
    const ambientLight = new THREE.HemisphereLight(
        'white', // bright sky color
        'darkslategrey', // dim ground color
        0.1 * power, // intensity
    );
    scene.add(ambientLight);
}

function createDirectionalLight(power = Math.PI) {
    const mainLight = new THREE.DirectionalLight('white', 1 * power);
    mainLight.position.copy(new THREE.Vector3(7 * VOXEL_SIZE, 20 * VOXEL_SIZE, 5 * VOXEL_SIZE));
    mainLight.castShadow = true;
    scene.add(mainLight);

    updateShadow(mainLight, 20);

    return mainLight;
}

function createLight() {
    const power = Math.PI;
    createAmbientLight(power)

    return createDirectionalLight(power)
}


let scene, renderer, light, keyboard;
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer("#add9e6");    // View function in util/utils

const raycaster = new THREE.Raycaster();
raycaster.near = 1.0 * VOXEL_SIZE;
raycaster.far = 3.0 * VOXEL_SIZE;

// Orbital camera
const camUp = new THREE.Vector3(0.0, 1.0, 0.0);

const orbitalCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);

orbitalCamera.position.copy(new THREE.Vector3(150 * VOXEL_SIZE, 30 * VOXEL_SIZE, 150 * VOXEL_SIZE));
orbitalCamera.up.copy(camUp);
orbitalCamera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
const orbitalControls = new OrbitControls(orbitalCamera, renderer.domElement);

const firstPersonCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const centerPosition = new THREE.Vector3(VOXEL_SIZE / 2, VoxelTransformer.transformVoxelCoordinate(buildingHeight) + 3 * (VOXEL_SIZE / 2), VOXEL_SIZE / 2);
firstPersonCamera.position.set(centerPosition.x - (10 * VOXEL_SIZE), centerPosition.y + 3 * (VOXEL_SIZE / 2), centerPosition.z);
firstPersonCamera.up.copy(camUp);
firstPersonCamera.lookAt(centerPosition);
const firstPersonControls = new PointerLockControls(firstPersonCamera, renderer.domElement);

const cubeMapTexture = new CubeTextureLoaderSingleFile(loadingManager).loadSingle(
    './assets/textures/sky_box.png', 1);
cubeMapTexture.colorSpace = THREE.SRGBColorSpace;

light = createLight();

// Create the main scene and Set its background as a cubemap (using a CubeTexture)
scene.background = cubeMapTexture;

keyboard = new KeyboardState();

const collidables = {};
const waterCollidables = {};

const fog = new THREE.Fog("#add9e6");
scene.fog = fog;

function createBatchVoxel(matKey, count) {
    const voxelGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
    const voxelMeshMaterial = VoxelMaterial.getMeshMaterial(matKey);
    const instancedMesh = new THREE.InstancedMesh(voxelGeometry, voxelMeshMaterial, count);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;
    scene.add(instancedMesh);
    return instancedMesh;
}

function createVoxel(x, y, z, key) {
    const voxelGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
    const voxelMeshMaterial = VoxelMaterial.getMeshMaterial(key);
    const voxelMesh = new THREE.Mesh(voxelGeometry, voxelMeshMaterial);
    voxelMesh.castShadow = true;
    voxelMesh.receiveShadow = true;

    voxelMesh.position.set(x, y, z);
    collidables[getGridPositionKey(voxelMesh.position)] = new THREE.Box3().setFromObject(voxelMesh);
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

async function addHouse(mapPosition) {
    const response = await fetch(`./assets/house/house.json`);
    const houseVoxelList = await response.json();
    houseVoxelList.forEach(({ gridX, gridY, gridZ, materialKey }) => {
        const x = VoxelTransformer.transformVoxelCoordinate(mapPosition.x + gridX, false);
        const y = VoxelTransformer.transformVoxelCoordinate(mapPosition.y + gridY);
        const z = VoxelTransformer.transformVoxelCoordinate(mapPosition.z + gridZ, false);
        createVoxel(x, y, z, materialKey);
    });
}

const rayInstancedMeshesMapping = {};

function placeVoxelInValley(payload, x, y, z) {
    const { matrixes, count } = payload;

    matrixes[count] = new THREE.Matrix4()
    matrixes[count].setPosition(
        VoxelTransformer.transformVoxelCoordinate(x, false),
        VoxelTransformer.transformVoxelCoordinate(y),
        VoxelTransformer.transformVoxelCoordinate(z, false),
    );

    const voxelGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
    const tempMesh = new THREE.Mesh(voxelGeometry, null);
    tempMesh.applyMatrix4(matrixes[count]);
    if (payload.key === MATERIAL.WATER) {
        waterCollidables[getGridPositionKey(tempMesh.position)] = new THREE.Box3().setFromObject(tempMesh);
    } else {
        collidables[getGridPositionKey(tempMesh.position)] = new THREE.Box3().setFromObject(tempMesh);
        rayInstancedMeshesMapping[getGridPositionKey(tempMesh.position)] = {
            key: payload.key,
            instanceId: count,
        }
    }
    payload.count++;
}

function updateInstanceMeshes(payload) {
    const instanceMesh = createBatchVoxel(payload.key, payload.matrixes.length);
    for (let j = 0; j < payload.matrixes.length; j++) {
        instanceMesh.setMatrixAt(j, payload.matrixes[j])
    }
    return instanceMesh;
}

let grassMeshes;
let sandMeshes;
let stoneMeshes;
let waterMeshes;
let dirtMeshes;

function renderValley() {
    const scale = 20;
    const smootheness = 40;
    const perlinOffset = 0.50;

    const grassPayload = { matrixes: [], count: 0, key: MATERIAL.GRASS };
    const dirtPayload = { matrixes: [], count: 0, key: MATERIAL.DIRT };
    const sandPayload = { matrixes: [], count: 0, key: MATERIAL.SAND };
    const stonePayload = { matrixes: [], count: 0, key: MATERIAL.STONE };
    const waterPayload = { matrixes: [], count: 0, key: MATERIAL.WATER };
    const treePositions = [];

    for (let x = - (EXEC_AXIS_VOXEL_COUNT / 2); x < (EXEC_AXIS_VOXEL_COUNT / 2); x++) {
        for (let z = -(EXEC_AXIS_VOXEL_COUNT / 2); z < (EXEC_AXIS_VOXEL_COUNT / 2); z++) {
            const isBuildingRange = x >= -10 && x <= 10 && z >= -10 && z <= 10;

            let heightValue;
            if (isBuildingRange) {
                heightValue = buildingHeight;
            } else {
                const heightMultiplier = terrainHeightPerlin.get((x / smootheness) + 0.01, (z / smootheness) + 0.01);

                heightValue = (heightMultiplier + perlinOffset) * scale;
                if (heightValue > 20) {
                    heightValue = 20;
                } else if (heightValue < 0) {
                    heightValue = 0;
                }
            }

            const typeMultiplier = terrainTypePerlin.get((x / smootheness), (z / smootheness));

            let selectedPayload = dirtPayload;
            if (typeMultiplier > 0.3) {
                selectedPayload = sandPayload;
            } else if (typeMultiplier < - 0.3 || isBuildingRange) {
                selectedPayload = stonePayload;
            }

            const treeRandom = (1 - Math.random()) * 100;
            if (
                treeRandom <= 0.1 &&
                selectedPayload.key === MATERIAL.DIRT &&
                Math.floor(heightValue) > 3 &&
                !isBuildingRange
            ) {
                const nextTreeMatrix = new THREE.Vector3(x, Math.floor(heightValue) + 1, z);
                const isAwayFromCenter = (x < 20 || x > 20) && (z < 20 || z > 20);
                const hasTreeNearby = treePositions.some(position =>
                    Math.abs(x - position.x) < 10 &&
                    Math.abs(z - position.z) < 10
                );
                if (!hasTreeNearby && isAwayFromCenter) {
                    treePositions.push(nextTreeMatrix);
                }
            }

            // Colocar o terreno
            for (let y = 0; y <= Math.floor(heightValue); y++) {
                if (selectedPayload.key === MATERIAL.DIRT && y === Math.floor(heightValue)) {
                    placeVoxelInValley(grassPayload, x, y, z);
                } else {
                    placeVoxelInValley(y > 2 ? selectedPayload : stonePayload, x, y, z);
                }
            }

            // Colocar a água
            for (let y = Math.floor(heightValue) + 1; y <= WATER_LEVEL; y++) {
                placeVoxelInValley(waterPayload, x, y, z);
            }
        }
    }

    stoneMeshes = updateInstanceMeshes(stonePayload);
    grassMeshes = updateInstanceMeshes(grassPayload);
    dirtMeshes = updateInstanceMeshes(dirtPayload);
    sandMeshes = updateInstanceMeshes(sandPayload);
    waterMeshes = updateInstanceMeshes(waterPayload);

    const promises = treePositions.map(position => {
        const treeValues = Object.values(TREE);
        const randomKey = treeValues[Math.floor(Math.random() * treeValues.length)];
        addTree(randomKey, position);
    });

    const promiseHouse = addHouse(new THREE.Vector3(0, Math.floor(buildingHeight) + 1, 0));

    return Promise.resolve([...promises, promiseHouse]);
}

function updateShadow(lightSource, scale) {
    lightSource.target = firstPersonCamera
    lightSource.position.set(
        firstPersonCamera.position.x + 7 * VOXEL_SIZE,
        firstPersonCamera.position.y + 20 * VOXEL_SIZE,
        firstPersonCamera.position.z,
    );

    const shadow = lightSource.shadow;

    const shadowSide = (30 + scale) * VOXEL_SIZE;
    const shadowNear = 0.1 * VOXEL_SIZE;
    const shadowFar = (20 + scale) * VOXEL_SIZE;

    shadow.mapSize.width = (1024 - 2 * scale) * VOXEL_SIZE;
    shadow.mapSize.height = (1024 - 2 * scale) * VOXEL_SIZE;
    shadow.camera.near = shadowNear;
    shadow.camera.far = shadowFar;
    shadow.camera.left = -shadowSide / 2;
    shadow.camera.right = shadowSide / 2;
    shadow.camera.bottom = -shadowSide / 2;
    shadow.camera.top = shadowSide / 2;

    shadow.needsUpdate = true;
}

window.addEventListener('resize', function () { onWindowResize(orbitalCamera, renderer) }, false);
window.addEventListener('resize', function () { onWindowResize(firstPersonCamera, renderer) }, false);

let isFirstPersonCamera = true;

// swith between cameras
window.addEventListener('keydown', (event) => {
    if (event.key === 'c') { // C 
        isFirstPersonCamera = !isFirstPersonCamera;
        if (isFirstPersonCamera) {
            firstPersonControls.lock();
            orbitalControls.enabled = false;
            firstPersonControls.enabled = true;
            scene.fog = null;
        } else {
            firstPersonControls.unlock();
            orbitalControls.enabled = true;
            firstPersonControls.enabled = false;
            // Isso é necessário para evitar um estado intermediário onde o usuário não consegue orbitar a câmera até apertar a tecla ESC.
            document.exitPointerLock();
            scene.fog = null;
            blocker.style.display = 'none';
            crosshair.style.display = 'none';
            isPaused = false;
        }
    }
});

// movement controls
const speed = 4 * VOXEL_SIZE;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
const acceleration = - 10 * VOXEL_SIZE;
const waterAcceleration = acceleration / 3;
let velocity = 0;
let canJump = true;

window.addEventListener('keydown', (event) => movementControls(event.key, true));
window.addEventListener('keyup', (event) => movementControls(event.key, false));
document.getElementById('webgl-output').addEventListener('click', function () {
    if (isFirstPersonCamera && !firstPersonControls.isLocked) {
        firstPersonControls.lock();
    }
}, false);

document.getElementById("webgl-output").appendChild(stats.domElement);

const blocker = document.getElementById('blocker');
const crosshair = document.getElementById('crosshair');

blocker.addEventListener('click', function (event) {
    firstPersonControls.lock();
    orbitalControls.enabled = false;
    firstPersonControls.enabled = true;
    scene.fog = fog;
});

let isPaused = false;

firstPersonControls.addEventListener('lock', function () {
    blocker.style.display = 'none';
    crosshair.style.display = 'block';
    isPaused = false;
});

firstPersonControls.addEventListener('unlock', function () {
    crosshair.style.display = 'none';
    if (isFirstPersonCamera) {
        blocker.style.display = 'block';
        isPaused = true;
    }
});

let canToggleFog = true;
let canToggleSong = true;
let isPlayingSound = true;

function movementControls(key, value) {
    switch (key) {
        case 'q':
            if (canToggleSong) {
                canToggleSong = false;
                if (isPlayingSound) { sound.stop() } else { sound.play() };
                isPlayingSound = !isPlayingSound;
                setTimeout(() => {
                    canToggleSong = true;
                }, 500);
            }
            break; // F
        case 'f':
            if (canToggleFog) {
                canToggleFog = false;
                scene.fog = !!scene.fog ? null : fog;
                setTimeout(() => {
                    canToggleFog = true;
                }, 500);
            }
            break; // F
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
        case 'ArrowUp':
            moveForward = value;
            break; // Cima
        case 'ArrowUp':
            moveBackward = value;
            break; // Baixo
        case 'ArrowLeft':
            moveLeft = value;
            break; // Esquerda
        case 'ArrowRight':
            moveRight = value;
            break; // Direita
        case ' ':
            if (canJump && firstPersonControls.isLocked) {
                // Se falso, significa que a gente precisa setar a velocidade inicial da altura;
                velocity = 6 * VOXEL_SIZE;
                canJump = false;
            }
            break; // Space
    }
}

function moveUp(distance) {
    const direction = new THREE.Vector3(0, 1, 0); // Default forward direction in local space

    direction.normalize();

    // Apply movement
    firstPersonCamera.position.addScaledVector(direction, distance);
}

function getCollidablesAround(collidableList) {
    const position = firstPersonCamera.position;
    const list = [];

    for (let x = position.x + (-5 * VOXEL_SIZE); x <= position.x + 5 * VOXEL_SIZE; x += VOXEL_SIZE) {
        for (let y = position.y + (-5 * VOXEL_SIZE); y <= position.y + 5 * VOXEL_SIZE; y += VOXEL_SIZE) {
            for (let z = position.z + (-5 * VOXEL_SIZE); z <= position.z + 5 * VOXEL_SIZE; z += VOXEL_SIZE) {
                const collidable = collidableList[getGridPositionKey(new THREE.Vector3(x, y, z))];
                if (collidable) {
                    list.push(collidable);
                }
            }
        }
    }
    return list;
}

function checkCollisionForward(distance) {
    const direction = new THREE.Vector3(0, 0, -1); // Default forward direction in local space
    const bandwidth = new THREE.Vector3(0, 1, 0); // UGH
    const quaternion = new THREE.Quaternion();

    // Extract rotation from the camera
    firstPersonCamera.getWorldQuaternion(quaternion);

    // Rotate the direction by the camera's quaternion
    direction.applyQuaternion(quaternion);

    // Move only in the XZ plane (ignore Y)
    direction.y = 0;
    direction.normalize();

    // Apply movement
    const futurePosition = firstPersonCamera.position.clone().addScaledVector(direction, distance).addScaledVector(bandwidth, 0.1);
    const geometry = new THREE.BoxGeometry(VOXEL_SIZE, 2 * VOXEL_SIZE, VOXEL_SIZE);
    const voxelMesh = new THREE.Mesh(geometry, null);
    voxelMesh.position.copy(futurePosition);
    const box = new THREE.Box3().setFromObject(voxelMesh)
    if (getCollidablesAround(collidables).some(collidable => collidable.intersectsBox(box))) {
        return true;
    }

    if (
        futurePosition.x <= - VoxelTransformer.transformVoxelCoordinate((EXEC_AXIS_VOXEL_COUNT / 2), false) ||
        futurePosition.x >= VoxelTransformer.transformVoxelCoordinate((EXEC_AXIS_VOXEL_COUNT / 2) - 1, false) ||
        futurePosition.z <= - VoxelTransformer.transformVoxelCoordinate((EXEC_AXIS_VOXEL_COUNT / 2), false) ||
        futurePosition.z >= VoxelTransformer.transformVoxelCoordinate((EXEC_AXIS_VOXEL_COUNT / 2) - 1, false)
    ) {
        return true
    }
    return false;
}

function checkCollisionRight(distance) {
    const direction = new THREE.Vector3(1, 0, 0); // Default forward direction in local space
    const bandwidth = new THREE.Vector3(0, 1, 0); // UGH
    const quaternion = new THREE.Quaternion();

    // Extract rotation from the camera
    firstPersonCamera.getWorldQuaternion(quaternion);

    // Rotate the direction by the camera's quaternion
    direction.applyQuaternion(quaternion);

    // Move only in the XZ plane (ignore Y)
    direction.y = 0;
    direction.normalize();

    // Apply movement
    const futurePosition = firstPersonCamera.position.clone().addScaledVector(direction, distance).addScaledVector(bandwidth, 0.1);
    const geometry = new THREE.BoxGeometry(VOXEL_SIZE, 2 * VOXEL_SIZE, VOXEL_SIZE);
    const voxelMesh = new THREE.Mesh(geometry, null);
    voxelMesh.position.copy(futurePosition);
    const box = new THREE.Box3().setFromObject(voxelMesh)
    if (getCollidablesAround(collidables).some(collidable => collidable.intersectsBox(box))) {
        return true;
    }
    if (
        futurePosition.x <= - VoxelTransformer.transformVoxelCoordinate((EXEC_AXIS_VOXEL_COUNT / 2), false) ||
        futurePosition.x >= VoxelTransformer.transformVoxelCoordinate((EXEC_AXIS_VOXEL_COUNT / 2) - 1, false) ||
        futurePosition.z <= - VoxelTransformer.transformVoxelCoordinate((EXEC_AXIS_VOXEL_COUNT / 2), false) ||
        futurePosition.z >= VoxelTransformer.transformVoxelCoordinate((EXEC_AXIS_VOXEL_COUNT / 2) - 1, false)
    ) {
        return true
    }
    return false;
}

function checkCollisionUp(distance, collidableList) {
    const direction = new THREE.Vector3(0, 1, 0); // Default forward direction in local space
    const bandwidth = new THREE.Vector3(0, 1, 0); // UGH

    direction.normalize();

    // Apply movement
    const futurePosition = firstPersonCamera.position.clone().addScaledVector(direction, distance).addScaledVector(bandwidth, 0.1);
    const geometry = new THREE.BoxGeometry(VOXEL_SIZE, 2 * VOXEL_SIZE, VOXEL_SIZE);
    const voxelMesh = new THREE.Mesh(geometry, null);
    voxelMesh.position.copy(futurePosition);
    const box = new THREE.Box3().setFromObject(voxelMesh)
    if (getCollidablesAround(collidableList).some(collidable => collidable.intersectsBox(box))) {
        return true;
    }
    return false;
}

function moveAnimate(delta) {
    const distance = speed * delta;

    if (moveForward && !checkCollisionForward(distance)) {
        firstPersonControls.moveForward(distance);
    }
    else if (moveBackward && !checkCollisionForward(-distance)) {
        firstPersonControls.moveForward(distance * -1);
    }
    if (moveRight && !checkCollisionRight(distance)) {
        firstPersonControls.moveRight(distance);
    }
    else if (moveLeft && !checkCollisionRight(-distance)) {
        firstPersonControls.moveRight(distance * -1);
    }
}

function moveJump(delta) {
    let alteredVelocity = velocity + acceleration * delta;
    let distanceY = alteredVelocity * delta;

    if (checkCollisionUp(distanceY, waterCollidables)) {
        // Recalcula com aceleração alterada para água
        velocity = velocity + waterAcceleration * delta;
        distanceY = velocity * delta;
    } else {
        velocity = alteredVelocity;
        distanceY = velocity * delta;
    }

    if (!checkCollisionUp(distanceY, collidables)) {
        moveUp(distanceY);
    } else {
        velocity = 0;
        canJump = true;
    }
}

renderValley().then(() => {
    // Esperamos carregar todas as árvores antes de renderizar o mapa.
    render();
});

let shadowScale = 20;

function buildInterface() {
    fog.near = shadowScale * VOXEL_SIZE;
    fog.far = fog.near + 2 * VOXEL_SIZE;
    var controls = new function () {
        this.fog = shadowScale;

        this.changeFog = function () {
            shadowScale = this.fog;
            updateShadow(light, shadowScale);
            fog.near = shadowScale * VOXEL_SIZE;
            fog.far = fog.near + 2 * VOXEL_SIZE;
        };
    };

    // GUI interface
    var gui = new GUI();
    gui.add(controls, 'fog', 20, 100)
        .onChange(function (e) { controls.changeFog() })
        .name("Fog");
}

document.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
        if (firstPersonControls.isLocked && !isPaused) {
            // TODO
            // eraseSelectedBlock();
        }
    } else if (event.button === 2) {
        if (canJump && firstPersonControls.isLocked) {
            velocity = 6 * VOXEL_SIZE;
            canJump = false;
        }
    }
});

const clock = new THREE.Clock();
buildInterface();
function render() {
    stats.update(); // Update FPS
    requestAnimationFrame(render);

    const delta = clock.getDelta()
    if (firstPersonControls.isLocked && !isPaused) {
        moveAnimate(delta);
        moveJump(delta);
        updateShadow(light, shadowScale)
        // checkCrosshairColision();
    }

    renderer.render(scene, isFirstPersonCamera ? firstPersonCamera : orbitalCamera);

}