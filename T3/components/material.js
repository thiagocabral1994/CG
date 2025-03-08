import * as THREE from 'three';
import { MATERIAL } from "../global/constants.js";

export const VoxelMaterial = {
    catalog: {
        [MATERIAL.GRASS]: {  textureTop : new THREE.TextureLoader().load('./assets/textures/full_grass.png'),
                             textureSide : new THREE.TextureLoader().load('./assets/textures/grass_side.jpg')},
        [MATERIAL.WATER]: {  textureTop : new THREE.TextureLoader().load('./assets/textures/water.jpeg'),
                             textureSide : new THREE.TextureLoader().load('./assets/textures/water.jpeg')},
        [MATERIAL.DEBUG]: { color: 'red' },
        [MATERIAL.STONE]: { color: 'gray' },
        [MATERIAL.SAND]: { color: 'gold' },
        [MATERIAL.M1]: {  textureTop : new THREE.TextureLoader().load('./assets/textures/tree_trunk.jpg'),
                           textureSide : new THREE.TextureLoader().load('./assets/textures/tree_trunk.jpg')},
        [MATERIAL.M2]: {  textureTop : new THREE.TextureLoader().load('./assets/textures/tree_trunk.jpg'),
            textureSide : new THREE.TextureLoader().load('./assets/textures/tree_trunk.jpg')},
        [MATERIAL.M3]: {  textureTop : new THREE.TextureLoader().load('./assets/textures/tree_trunk.jpg'),
            textureSide : new THREE.TextureLoader().load('./assets/textures/tree_trunk.jpg')},
        [MATERIAL.M4]: {  textureTop : new THREE.TextureLoader().load('./assets/textures/tree_leaf.png'),
            textureSide : new THREE.TextureLoader().load('./assets/textures/tree_leaf.png')},
        [MATERIAL.M5]: {  textureTop : new THREE.TextureLoader().load('./assets/textures/tree_leaf.png'),
            textureSide : new THREE.TextureLoader().load('./assets/textures/tree_leaf.png')},
        [MATERIAL.BUILDER_FLOOR]: { color: 'lightblue' },
        [MATERIAL.EXEC_FLOOR_0]: { color: 'lightgreen' },
        [MATERIAL.EXEC_FLOOR_1]: { color: '#D2B48C' },
        [MATERIAL.EXEC_FLOOR_2]: { color: 'purple' },
    },
    getCursorMeshMaterial: (key) => {
        return new THREE.MeshLambertMaterial({ ...VoxelMaterial.catalog[key], opacity: 0.5, transparent: true });
    },
    getCursorWireframeMaterial: () => {
        return new THREE.MeshLambertMaterial({ color: "black", wireframe: true });
    },
    getMeshMaterial: (key) => {
        const textures = VoxelMaterial.catalog[key];
        console.log(textures)
        if (textures) {
            const materials = [
                new THREE.MeshStandardMaterial({ map: textures.textureSide }), // lado 1
                new THREE.MeshStandardMaterial({ map: textures.textureSide }), // lado 2
                new THREE.MeshStandardMaterial({ map: textures.textureTop }), // topo
                new THREE.MeshStandardMaterial({ map: textures.textureSide }), // base
                new THREE.MeshStandardMaterial({ map: textures.textureSide }), // lado 3
                new THREE.MeshStandardMaterial({ map: textures.textureSide })  // lado 4
            ];
            return materials;
        }
    },
}

