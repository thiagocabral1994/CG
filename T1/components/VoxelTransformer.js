import { VOXEL_SIZE } from "../global/constants.js";

export const VoxelTransformer = {
    /**
     * Converte o valor de uma coordenada adicionando a dimensão do voxel
     * 
     * @param {number} baseCoordinate 
     */
    transformVoxelCoordinate: (baseCoordinate) => {
        return baseCoordinate * VOXEL_SIZE + (VOXEL_SIZE / 2);
    },
 
    /**
     * Converte o valor de uma coordenada retirando o valor da dimensão do voxel
     * 
     * @param {number} coordinate 
     */
    transformGridCoordinate: (coordinate) => {
        return (coordinate - (VOXEL_SIZE / 2)) / VOXEL_SIZE;
    }
};