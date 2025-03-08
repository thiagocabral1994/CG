import * as THREE from 'three';

export const VOXEL_SIZE = 5;
export const BUILDER_AXIS_VOXEL_COUNT = 10;
export const EXEC_AXIS_VOXEL_COUNT = 200;
export const MATERIAL = {
    DEBUG: "DEBUG",
    STONE: "STONE",
    GRASS: "GRASS",
    DIRT: "DIRT",
    SAND: "SAND",
    TRUNK_1: "TRUNK_1",
    TRUNK_2: "TRUNK_2",
    TRUNK_3: "TRUNK_3",
    LEAF_1: "LEAF_1",
    LEAF_2: "LEAF_2",
    BUILDER_FLOOR: "BUILDER_FLOOR",
    WATER: "WATER",
    PLANK: "PLANK",
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

export const WATER_LEVEL = 4;