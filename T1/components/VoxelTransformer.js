import { VOXEL_SIZE } from "../global/constants.js";

export const VoxelTransformer = {
    /**
     * Converte o valor de uma coordenada adicionando a dimensão do voxel
     * 
     * @param {number} baseCoordinate
     * @param {number} isEvenGrid - (default: true) Flag se o grid é dividido em `n` partes, tal que `n` é par
     */
    transformVoxelCoordinate: (baseCoordinate, isEvenGrid = true) => {
        return baseCoordinate * VOXEL_SIZE + (isEvenGrid ? (VOXEL_SIZE / 2) : 0);
    },
 
    /**
     * Converte o valor de uma coordenada retirando o valor da dimensão do voxel
     * 
     * @param {number} coordinate
     * @param {number} isEvenGrid - (default: true) Flag se o grid é dividido em `n` partes, tal que `n` é par
     */
    transformGridCoordinate: (coordinate, isEvenGrid = true) => {
        return (coordinate - (isEvenGrid ? (VOXEL_SIZE / 2) :  0)) / VOXEL_SIZE;
    }
};