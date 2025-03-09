import * as THREE from 'three';
import { VoxelMaterial } from './material.js';
import { VOXEL_SIZE } from '../global/constants.js';

export const VoxelBuilder = {
    createVoxelMesh: (position, materialKey) => {
        const voxelGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
        const voxelMeshMaterial = VoxelMaterial.getMeshMaterial(materialKey);
        const voxelMesh = new THREE.Mesh(voxelGeometry, voxelMeshMaterial);
        voxelMesh.castShadow = true;
        voxelMesh.receiveShadow = true;
        voxelMesh.position.set(position.x, position.y, position.z);
        return voxelMesh
    }
}