import * as THREE from 'three';
import { MATERIAL } from "../global/constants.js";

export const VoxelMaterial = {
    catalog: {
        [MATERIAL.M1]: { color: '#D6B99B' },
        [MATERIAL.M2]: { color: '#A67C52' },
        [MATERIAL.M3]: { color: '#6E4B3A' },
        [MATERIAL.M4]: { color: '#F0C35B' },
        [MATERIAL.M5]: { color: 'green' },
        [MATERIAL.BUILDER_FLOOR]: { color: 'lightblue' },
        [MATERIAL.EXEC_FLOOR_0]: { color: 'lightgreen' },
        [MATERIAL.EXEC_FLOOR_1]: { color: '#D2B48C' },
        [MATERIAL.EXEC_FLOOR_2]: { color: 'purple' },
        [MATERIAL.PLACEHOLDER]: { color: 'gray' },
    },
    getCursorMeshMaterial: (key) => {
        return new THREE.MeshBasicMaterial({ ...VoxelMaterial.catalog[key], opacity: 0.5, transparent: true });
    },
    getMeshMaterial: (key) => {
        return new THREE.MeshBasicMaterial({ ...VoxelMaterial.catalog[key] });
    },
};