import * as THREE from 'three';
import { MATERIAL } from "../global/constants.js";

export const VoxelMaterial = {
    catalog: {
        [MATERIAL.M1]: { color: 'green' },
        [MATERIAL.M2]: { color: 'red' },
        [MATERIAL.M3]: { color: 'blue' },
        [MATERIAL.M4]: { color: 'yellow' },
        [MATERIAL.M5]: { color: 'purple' },
        [MATERIAL.BUILDER_FLOOR]: { color: 'lightblue' },
    },
    getCursorMeshMaterial: (key) => {
        return new THREE.MeshBasicMaterial({ ...VoxelMaterial.catalog[key], opacity: 0.5, transparent: true });
    },
    getMeshMaterial: (key) => {
        return new THREE.MeshBasicMaterial({ ...VoxelMaterial.catalog[key] });
    },
};