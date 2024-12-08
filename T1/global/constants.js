import * as THREE from 'three';

export const VOXEL_SIZE = 5;
export const BUILDER_AXIS_VOXEL_COUNT = 10;
export const EXEC_AXIS_VOXEL_COUNT = 35;
export const MATERIAL = {
    M1: "M1",
    M2: "M2",
    M3: "M3",
    M4: "M4",
    M5: "M5",
    BUILDER_FLOOR: "BUILDER_FLOOR",
    EXEC_FLOOR_0: "EXEC_FLOOR_0",
    EXEC_FLOOR_1: "EXEC_FLOOR_1",
    EXEC_FLOOR_2: "EXEC_FLOOR_2",
}

export const TREE = {
    T1: "tree_1",
    T2: "tree_2",
    T3: "tree_3",
    T4: "tree_4",
    T5: "tree_5",
}

export const TREE_SLOTS = [
    { tree: TREE.T2, position: new THREE.Vector3(-6, 1, -10) },
    { tree: TREE.T4, position: new THREE.Vector3(-4, 1, 1) },
    { tree: TREE.T5, position: new THREE.Vector3(-6, 1, 11) },
    { tree: TREE.T5, position: new THREE.Vector3(8, 1, -11) },
    { tree: TREE.T2, position: new THREE.Vector3(10, 1, 1) },
    { tree: TREE.T4, position: new THREE.Vector3(8, 1, 13) },
];

export const EXPORT_FILENAME = "tree.json";