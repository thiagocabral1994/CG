import * as THREE from 'three';
import { VoxelMaterial } from './material.js';
import { VOXEL_SIZE } from '../global/constants.js';

export const VoxelBuilder = {
    // Essa vai ser a abstração da criaçao do voxel. Criamos sempre um cubo baseado em um VOXEL_SIZE configurado
    createVoxelMesh: (position, materialKey) => {
        const voxelGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);
        const voxelMeshMaterial = VoxelMaterial.getMeshMaterial(materialKey);
        const voxelMesh = new THREE.Mesh(voxelGeometry, voxelMeshMaterial);
        voxelMesh.position.set(position.x, position.y, position.z);
        return voxelMesh
    }
}