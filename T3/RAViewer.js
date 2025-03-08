import * as THREE from 'three';
import { ARjs } from '../libs/AR/ar.js';
import Stats from '../build/jsm/libs/stats.module.js';
import {
   initRenderer
} from "../libs/util/util.js";
import { VoxelMaterial } from './components/material.js';

var stats = new Stats();

// init scene and camera
let scene, camera, renderer;
renderer = initRenderer();
renderer.setClearColor(new THREE.Color('lightgrey'), 0)
scene = new THREE.Scene();
camera = new THREE.Camera();
scene.add(camera);

document.getElementById("webgl-output").appendChild(stats.domElement);

function createAmbientLight(power) {
    const ambientLight = new THREE.HemisphereLight(
        'white', // bright sky color
        'darkslategrey', // dim ground color
        0.1 * power, // intensity
    );
    scene.add(ambientLight);
}

function createDirectionalLight(power = Math.PI) {
    const mainLight = new THREE.DirectionalLight('white', 1 * power);
    mainLight.position.copy(new THREE.Vector3(3, 4, -7));
    mainLight.castShadow = true;
    scene.add(mainLight);

    updateShadow(mainLight);

    return mainLight;
}

function updateShadow(lightSource) {

    const shadow = lightSource.shadow;

    const shadowSide = 5;
    const shadowNear = 0.1;
    const shadowFar = 10;

    shadow.mapSize.width = 512;
    shadow.mapSize.height = 512;
    shadow.camera.near = shadowNear;
    shadow.camera.far = shadowFar;
    shadow.camera.left = -shadowSide / 2;
    shadow.camera.right = shadowSide / 2;
    shadow.camera.bottom = -shadowSide / 2;
    shadow.camera.top = shadowSide / 2;

    shadow.needsUpdate = true;
}

function createLight() {
    const power = Math.PI;
    createAmbientLight(power)

    return createDirectionalLight(power)
}

const light = createLight();

// Set AR Stuff
let AR = {
   source: null,
   context: null,
}
setARStuff();

window.addEventListener('resize', function () { onResize() })

function createVoxel(x, y, z, key) {
   const voxelGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
   const voxelMeshMaterial = VoxelMaterial.getMeshMaterial(key);
   const voxelMesh = new THREE.Mesh(voxelGeometry, voxelMeshMaterial);
   voxelMesh.castShadow = true;
   voxelMesh.receiveShadow = true;

   voxelMesh.position.set(x, y, z);
   scene.add(voxelMesh);
}

async function addHouse() {
   const response = await fetch(`./assets/house/house.json`);
   const houseVoxelList = await response.json();
   houseVoxelList.forEach(({ gridX, gridY, gridZ, materialKey }) => {
      const x = gridX * 0.1;
      const y = gridY * 0.1;
      const z = gridZ * 0.1;
      createVoxel(x, y, z, materialKey);
   });
}


//----------------------------------------------------------------------------
// Render the whole thing on the page
addHouse().then(() => {
   render();
});

function render() {
   stats.update(); // Update FPS
   updateAR();
   requestAnimationFrame(render);
   renderer.render(scene, camera) // Render scene
}

function updateAR() {
   if (AR.source) {
      if (AR.source.ready === false) return
      AR.context.update(AR.source.domElement)
      scene.visible = camera.visible
   }
}


function onResize() {
   AR.source.onResizeElement()
   AR.source.copyElementSizeTo(renderer.domElement)
   if (AR.context.arController !== null) {
      AR.source.copyElementSizeTo(AR.context.arController.canvas)
   }
}

function setARStuff() {
   //----------------------------------------------------------------------------
   // Handle arToolkitSource
   // More info: https://ar-js-org.github.io/AR.js-Docs/marker-based/
   AR.source = new ARjs.Source({
      // to read from a video
      sourceType: 'video',
      sourceUrl: '../assets/AR/kanjiScene.mp4'

      // to read from the webcam
      //sourceType : 'webcam',

      // to read from an image
      // sourceType : 'image',
      // sourceUrl : '../assets/AR/kanjiScene.jpg',

   })

   AR.source.init(function onReady() {
      setTimeout(() => {
         onResize()
      }, 100);
   })

   //----------------------------------------------------------------------------
   // initialize arToolkitContext
   AR.context = new ARjs.Context({
      cameraParametersUrl: '../libs/AR/data/camera_para.dat',
      detectionMode: 'mono',
   })

   // initialize it
   AR.context.init(function onCompleted() {
      camera.projectionMatrix.copy(AR.context.getProjectionMatrix());
   })

   //----------------------------------------------------------------------------
   // Create a ArMarkerControls
   let markerControls;
   markerControls = new ARjs.MarkerControls(AR.context, camera, {
      type: 'pattern',
      patternUrl: '../libs/AR/data/patt.kanji',
      changeMatrixMode: 'cameraTransformMatrix' // as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
   })
   // as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
   scene.visible = false
}