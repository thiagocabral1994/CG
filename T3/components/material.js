import * as THREE from 'three';
import { MATERIAL } from "../global/constants.js";
import { loadingManager } from './loadManager.js';

export const textureLoader = new THREE.TextureLoader(loadingManager);
const fullGrass = textureLoader.load('./assets/textures/full_grass.png');
fullGrass.colorSpace = THREE.SRGBColorSpace;
const fullLand = textureLoader.load('./assets/textures/full_land.png');
fullLand.colorSpace = THREE.SRGBColorSpace;
const grassSide = textureLoader.load('./assets/textures/grass_side.jpg');
grassSide.colorSpace = THREE.SRGBColorSpace;
const treeInside = textureLoader.load('./assets/textures/tree_inside.png');
treeInside.colorSpace = THREE.SRGBColorSpace;
const treeTrunk = textureLoader.load('./assets/textures/tree_trunk.jpg');
treeTrunk.colorSpace = THREE.SRGBColorSpace;
const treeInside2 = textureLoader.load('./assets/textures/inside2.jpg');
treeInside2.colorSpace = THREE.SRGBColorSpace;
const treeTrunk2 = textureLoader.load('./assets/textures/trunk2.jpg');
treeTrunk2.colorSpace = THREE.SRGBColorSpace;
const treeInside3 = textureLoader.load('./assets/textures/inside3.jpg');
treeInside3.colorSpace = THREE.SRGBColorSpace;
const treeTrunk3 = textureLoader.load('./assets/textures/trunk3.jpg');
treeTrunk3.colorSpace = THREE.SRGBColorSpace;
const water = textureLoader.load('./assets/textures/water.jpeg');
water.colorSpace = THREE.SRGBColorSpace;
const stone = textureLoader.load('./assets/textures/stone.jpg');
stone.colorSpace = THREE.SRGBColorSpace;
const sand = textureLoader.load('./assets/textures/sand.jpg');
sand.colorSpace = THREE.SRGBColorSpace;
const leaf = textureLoader.load('./assets/textures/tree_leaf.png');
    leaf.colorSpace = THREE.SRGBColorSpace;
const leaf2 = textureLoader.load('./assets/textures/tree_leaf2.png');
leaf2.colorSpace = THREE.SRGBColorSpace;
const plank = textureLoader.load('./assets/textures/plank.jpg');
plank.colorSpace = THREE.SRGBColorSpace;

const builderFloor = textureLoader.load('./assets/textures/builder_floor.jpg');
builderFloor.wrapS = THREE.RepeatWrapping;
builderFloor.wrapT = THREE.RepeatWrapping;
builderFloor.repeat.set(10, 10);

export const VoxelMaterial = {
    catalog: {
        [MATERIAL.DEBUG]: { color: 'red' },
        [MATERIAL.STONE]: { map: stone },
        [MATERIAL.GRASS]: [
            { map: grassSide }, // lado 1
            { map: grassSide }, // lado 2
            { map: fullGrass }, // topo
            { map: fullLand }, // base
            { map: grassSide }, // lado 3
            { map: grassSide }, // lado 4
        ],
        [MATERIAL.DIRT]: { map: fullLand },
        [MATERIAL.SAND]: { map: sand },
        [MATERIAL.TRUNK_1]: [
            { map: treeTrunk }, // lado 1
            { map: treeTrunk }, // lado 2
            { map: treeInside }, // topo
            { map: treeInside }, // base
            { map: treeTrunk }, // lado 3
            { map: treeTrunk }, // lado 4
        ],
        [MATERIAL.TRUNK_2]: [
            { map: treeTrunk2 }, // lado 1
            { map: treeTrunk2 }, // lado 2
            { map: treeInside2 }, // topo
            { map: treeInside2 }, // base
            { map: treeTrunk2 }, // lado 3
            { map: treeTrunk2 }, // lado 4
        ],
        [MATERIAL.TRUNK_3]: [
            { map: treeTrunk3 }, // lado 1
            { map: treeTrunk3 }, // lado 2
            { map: treeInside3 }, // topo
            { map: treeInside3 }, // base
            { map: treeTrunk3 }, // lado 3
            { map: treeTrunk3 }, // lado 4
        ],
        [MATERIAL.LEAF_1]: { map: leaf, transparent: true, side: THREE.DoubleSide, alphaTest: 0.5, opacity: 1 },
        [MATERIAL.LEAF_2]: { map: leaf2, transparent: true, side: THREE.DoubleSide, alphaTest: 0.5, opacity: 1 },
        [MATERIAL.BUILDER_FLOOR]: { map: builderFloor, side: THREE.DoubleSide },
        [MATERIAL.WATER]: [
                { visible: false }, // lado 1
                { visible: false }, // lado 2
                { map: water, opacity: 0.6, transparent: true, side: THREE.DoubleSide }, // topo
                { visible: false }, // base
                { visible: false }, // lado 3
                { visible: false } // lado 4
        ],
        [MATERIAL.PLANK]: { map: plank }
    },
    getCursorMeshMaterial: (key) => {
        if (Array.isArray(VoxelMaterial.catalog[key])) {
            return VoxelMaterial.catalog[key].map(item => new THREE.MeshLambertMaterial({ ...item, opacity: 0.5, transparent: true }))
        }
        return new THREE.MeshLambertMaterial({ ...VoxelMaterial.catalog[key], opacity: 0.5, transparent: true });
    },
    getCursorWireframeMaterial: () => {
        return new THREE.MeshLambertMaterial({ color: "black", wireframe: true });
    },
    getMeshMaterial: (key) => {
        if (Array.isArray(VoxelMaterial.catalog[key])) {
            return VoxelMaterial.catalog[key].map(item => new THREE.MeshLambertMaterial({ ...item, transparent: true }));
        }
        return new THREE.MeshLambertMaterial({ ...VoxelMaterial.catalog[key] });
    },
};