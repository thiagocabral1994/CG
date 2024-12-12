import * as THREE from 'three';

// Tamanho do Voxel
export const VOXEL_SIZE = 5;

// Quantidade de voxels em um eixo no ambiente do builder
export const BUILDER_AXIS_VOXEL_COUNT = 10;

// Quantidade de voxels em um eixo no ambiente de execução
export const EXEC_AXIS_VOXEL_COUNT = 35;

// IDs dos materiais.
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
    PLACEHOLDER: "PLACEHOLDER",
}


// Nome dos arquivos de árvore sem a extensão.
export const TREE = {
    T1: "tree_1",
    T2: "tree_2",
    T3: "tree_3",
    T4: "tree_4",
    T5: "tree_5",
}

// Lista das posições onde serão colocadas cada árvore identificada.
export const TREE_SLOTS = [
    { tree: TREE.T2, position: new THREE.Vector3(-6, 1, -10) },
    { tree: TREE.T4, position: new THREE.Vector3(-4, 1, 1) },
    { tree: TREE.T5, position: new THREE.Vector3(-6, 1, 11) },
    { tree: TREE.T5, position: new THREE.Vector3(8, 1, -11) },
    { tree: TREE.T2, position: new THREE.Vector3(10, 1, 1) },
    { tree: TREE.T4, position: new THREE.Vector3(8, 1, 13) },
];

// Nome do arquivo de exportação
export const EXPORT_FILENAME = "tree.json";