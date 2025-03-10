import * as THREE from  'three';
import GUI from '../libs/util/dat.gui.module.js'
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import {initRenderer, 
        createGroundPlane,
        createLightSphere,        
        onWindowResize, 
        radiansToDegrees} from "../libs/util/util.js";

let scene, renderer, camera, orbit; // Initial variables   
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer("rgb(80, 70, 170)");    // View function in util/utils
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(3.6, 4.6, 8.2);
  camera.up.set( 0, 1, 0 );
orbit = new OrbitControls( camera, renderer.domElement );

// More info here: https://threejs.org/docs/#api/en/lights/AmbientLight
const ambientColor = "rgb(60,60,60)";
let ambientLight = new THREE.AmbientLight(ambientColor);
scene.add( ambientLight );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

let groundPlane = createGroundPlane(10, 10, 40, 40); // width, height, resolutionW, resolutionH
  groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
scene.add(groundPlane);

// Create objects
createTeapot( 2.0,  0.5,  0.0, Math.random() * 0xffffff);
createTeapot(0.0,  0.5,  2.0, Math.random() * 0xffffff);  
createTeapot(0.0,  0.5, -2.0, Math.random() * 0xffffff);    

//---------------------------------------------------------
// Default light position
let lightPosition = new THREE.Vector3(3.7, 2.2, 1.0);

// Sphere to represent the light
let lightSphere = createLightSphere(scene, 0.05, 10, 10, lightPosition);

//---------------------------------------------------------
// Create and set the spotlight
let spotLight = new THREE.SpotLight("rgb(255,255,255)");
  spotLight.position.copy(lightPosition);
  spotLight.distance = 0;
  spotLight.castShadow = true;
  spotLight.decay = 2;
  spotLight.penumbra = 0.5;
  spotLight.intensity = 20;
  spotLight.angle= THREE.MathUtils.degToRad(40);
  // Shadow Parameters
  spotLight.shadow.mapSize.width = 512;
  spotLight.shadow.mapSize.height = 512;
  spotLight.shadow.camera.fov = radiansToDegrees(spotLight.angle);
  spotLight.shadow.camera.near = .2;    
  spotLight.shadow.camera.far = 20.0;        

scene.add(spotLight);
scene.add(spotLight.target);

// Create helper for the spotlight
const spotHelper = new THREE.SpotLightHelper(spotLight, 0xFF8C00);
scene.add(spotHelper);

// Create helper for the spotlight shadow
const shadowHelper = new THREE.CameraHelper(spotLight.shadow.camera);
scene.add(shadowHelper);

buildInterface();
render();

function createTeapot(x, y, z, color )
{
  let geometry = new TeapotGeometry(0.5);
  let material = new THREE.MeshPhongMaterial({ color, shininess: "100", specular: 'white' });
    material.side = THREE.DoubleSide;
  let obj = new THREE.Mesh(geometry, material);
    obj.castShadow = true;
    obj.position.set(x, y, z);
  scene.add(obj);
}

function updateLight() {
  lightSphere.position.copy(spotLight.position);
  spotLight.shadow.camera.updateProjectionMatrix();     
  spotHelper.update();
  shadowHelper.update();    
}

function makeXYZGUI(gui, vector3, name, onChangeFn) {
  const folder = gui.addFolder(name);
  folder.add(vector3, 'x', -10, 10).onChange(onChangeFn);
  folder.add(vector3, 'y', 0, 10).onChange(onChangeFn);
  folder.add(vector3, 'z', -10, 10).onChange(onChangeFn);
  folder.open();
}    

function buildInterface()
{
  //------------------------------------------------------------
  // Interface
  let controls = new function ()
  {
    this.angle = radiansToDegrees(spotLight.angle);
    this.shadowMapSize = spotLight.shadow.mapSize.width;
  
    this.onUpdateLightAngle = function(){
      spotLight.angle = THREE.MathUtils.degToRad(this.angle);
      updateLight();      
    };   
    this.onUpdateShadowFar = function(){
      if(spotLight.shadow.camera.far <= spotLight.shadow.camera.near-0.1) // set far always greater than near
        spotLight.shadow.camera.near = 0.1;
      updateLight(); 
    };   
    this.onUpdateShadowNear = function(){
      if(spotLight.shadow.camera.near >= spotLight.shadow.camera.far) // set near always smaller than far
        spotLight.shadow.camera.far = spotLight.shadow.camera.near+10;
      updateLight();                
    };
    this.onUpdateShadowMap = function(){
      spotLight.shadow.mapSize.width = this.shadowMapSize;
      spotLight.shadow.mapSize.height = this.shadowMapSize;   
      //spotLight.shadow.map.dispose(); 
      spotLight.shadow.map = null;
    };     
  };

  let gui = new GUI();
  
  let spotFolder = gui.addFolder("SpotLight Parameters");
  spotFolder.open();  
  spotFolder.add(spotHelper, 'visible', true)
    .name("Helper");    
  spotFolder.add(spotLight, 'intensity', 0, 200);
  spotFolder.add(spotLight, 'penumbra', 0, 1);    
  spotFolder.add(spotLight, 'distance', 0, 40, 0.5)
    .onChange(function(){updateLight()});        
  spotFolder.add(controls, 'angle', 20, 60)
    .name("Angle")
    .onChange(function() { controls.onUpdateLightAngle() });
  makeXYZGUI(spotFolder, spotLight.position, 'position', updateLight);
  makeXYZGUI(spotFolder, spotLight.target.position, 'target', updateLight);
  
  let shadowFolder = gui.addFolder("Shadow");
  shadowFolder.open();    
  shadowFolder.add(shadowHelper, 'visible', true)
    .name("Helper");
  // Controls if the shadow needs to be updated
  shadowFolder.add(renderer.shadowMap, 'autoUpdate', true)
    .onChange(function() { controls.onUpdateShadowNear() })
    .name("Auto Update");
  shadowFolder.add(controls, 'shadowMapSize', 16, 1024, 16)
    .onChange(function() { controls.onUpdateShadowMap() });
  shadowFolder.add(spotLight.shadow.camera, 'near', .1, 30, 0.1)
    .onChange(function() { controls.onUpdateShadowNear() })
    .listen(); // Change GUI when the value changes outside
  shadowFolder.add(spotLight.shadow.camera, 'far', .1, 30, 0.1)
    .onChange(function() { controls.onUpdateShadowFar()  })
    .listen();
}

function render()
{
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}