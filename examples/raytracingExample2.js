import * as THREE 			from  'three';
import {RaytracingRenderer} from  '../libs/other/raytracingRenderer.js';

let container = document.createElement( 'div' );
document.body.appendChild( container );

let scene = new THREE.Scene();

// The canvas is in the XY plane.
// Hint: put the camera in the positive side of the Z axis and the
// objects in the negative side
let camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
camera.position.z = 4;
camera.position.y = 1.5;

// light
let intensity = 0.5;

let light = new THREE.DirectionalLight( 0x55aaff, intensity );
light.position.set( -1.00, 1.50, 2.00 );
scene.add( light );

light = new THREE.DirectionalLight( 0xffffff, intensity );
light.position.set( 1.00, 1.50, 2.00 );
scene.add( light );

let renderer = new RaytracingRenderer(window.innerWidth, window.innerHeight, 32, camera);
container.appendChild( renderer.domElement );

// materials
let phongMaterialBox = new THREE.MeshLambertMaterial( {
	color: "rgb(255,255,255)",
} );

let phongMaterialBoxBottom = new THREE.MeshLambertMaterial( {
	color: "rgb(180,180,180)",
} );

let phongMaterialBoxLeft = new THREE.MeshLambertMaterial( {
	color: "rgb(200,0,0)",
} );

let phongMaterialBoxRight = new THREE.MeshLambertMaterial( {
	color: "rgb(0,200,0)",
} );

let phongMaterial = new THREE.MeshPhongMaterial( {
	color: "rgb(150,190,220)",
	specular: "rgb(255,255,255)",
	shininess: 1000,
	} );

let mirrorMaterial = new THREE.MeshPhongMaterial( {
	color: "rgb(0,0,0)",
	specular: "rgb(255,255,255)",
	shininess: 1000,
} );
mirrorMaterial.mirror = true;
mirrorMaterial.reflectivity = 1.0;

let mirrorMaterialDark = new THREE.MeshPhongMaterial( {
	color: "rgb(0,0,0)",
	specular: "rgb(170,170,170)",
	shininess: 10000,
} );
mirrorMaterialDark.mirror = true;
mirrorMaterialDark.reflectivity = 1;

let mirrorMaterialSmooth = new THREE.MeshPhongMaterial( {
	color: "rgb(255,170,0)",
	specular: "rgb(34,34,34)",
	shininess: 10000,
} );
mirrorMaterialSmooth.mirror = true;
mirrorMaterialSmooth.reflectivity = 0.1;

let glassMaterialSmooth = new THREE.MeshPhongMaterial( {
	color: "rgb(0,0,0)",
	specular: "rgb(255,255,255)",
	shininess: 10000,
} );
glassMaterialSmooth.glass = true;
glassMaterialSmooth.reflectivity = 0.25;
glassMaterialSmooth.refractionRatio = 1.5;

// geometries
let sphereGeometry = new THREE.SphereGeometry( 1, 24, 24 );
let backMirrorGeometry = new THREE.BoxGeometry( 4.50, 0.05, 3.00 );
let boxGeometry = new THREE.BoxGeometry( 1.00, 1.00, 1.00 );

// Sphere
let sphere = new THREE.Mesh( sphereGeometry, phongMaterial );
sphere.scale.multiplyScalar( 0.5 );
sphere.position.set( -0.5, 0, -0.2 );
scene.add( sphere );

// Mirror Sphere
let sphere2 = new THREE.Mesh( sphereGeometry, mirrorMaterialSmooth );
sphere2.scale.multiplyScalar( 0.8 );
sphere2.position.set( 1.75, .30, -1.50 );
scene.add( sphere2 );

// Glass Sphere (black-right-front)
let glass = new THREE.Mesh( sphereGeometry, glassMaterialSmooth );
glass.scale.multiplyScalar( 0.5 );
glass.position.set( 1.20, 0, -.50 );
glass.rotation.y = 0.6;
scene.add( glass );

// Box
let box = new THREE.Mesh( boxGeometry, mirrorMaterial );
box.position.set( -1.75, 0, -1.90 );
box.rotation.y = 0.64; // 37 graus
scene.add( box );

// Back Mirror
let backmirror = new THREE.Mesh( backMirrorGeometry, mirrorMaterialDark );
backmirror.rotation.x = 1.57;
backmirror.position.set( 0, 1.50, -2.90 );
backmirror.scale.multiplyScalar( 0.95 );
scene.add( backmirror );

let planeGeometry = new THREE.BoxGeometry( 6.0, 0.05, 6.00 );
let planeSidesGeometry = new THREE.BoxGeometry( 4.0, 0.05, 6.00 );

// bottom
let plane = new THREE.Mesh( planeGeometry, phongMaterialBoxBottom );
plane.position.set( 0, -.5, -3.00 );
scene.add( plane );

// top
plane = new THREE.Mesh( planeGeometry, phongMaterialBox );
plane.position.set( 0, 3.5, -3.00 );
scene.add( plane );

// back
plane = new THREE.Mesh( planeGeometry, phongMaterialBox );
plane.rotation.x = 1.57;
plane.position.set( 0, 2.50, -3.00 );
scene.add( plane );

// left
plane = new THREE.Mesh( planeSidesGeometry, phongMaterialBoxLeft );
plane.rotation.z = 1.57;
plane.position.set( -3.00, 1.5, -3.00 )
scene.add( plane );

// right
plane = new THREE.Mesh( planeSidesGeometry, phongMaterialBoxRight );
plane.rotation.z = 1.57;
plane.position.set( 3.00, 1.5, -3.00 )
scene.add( plane );

render();

function render()
{
	renderer.render( scene, camera );
}
