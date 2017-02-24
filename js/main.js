window.addEventListener('load', init, false);

// color palette
var Colors = {
	red:0xf25346,
	white:0xd8d0d1,
	// color palette
	brown:0x59332e,
	pink:0xF5986E,
	brownDark:0x23190f,
	blue:0x68c3c0,
};

var listener = new THREE.AudioListener();

// create an Audio source
var sound = new THREE.Audio( listener );

var audioLoader = new THREE.AudioLoader();
var analyser = new THREE.AudioAnalyser( sound, 32 );
//Load a sound and set it as the Audio object's buffer

function init() {
	// set up the scene, the camera and the renderer
	createScene();


	createSky();
	camera.add( listener );
	audioLoader.load( 'http://localhost:8000/music.mp3', function( buffer ) {
	sound.setBuffer( buffer );
	sound.setLoop(true);
	sound.setVolume(0.5);
	sound.play();
});
		// add the lights
	createLights();

	// add the objects
	createStars();
	createSea();
	createCube();

	// start a loop that will update the objects' positions 
	// and render the scene on each frame
	loop();
}

function loop(){
	// Rotate the propeller, the sea and the sky

	// render the scene
	sea.moveWaves();
	cube.moveCube();
	moveStars();
	sky.moveSky();
	// if (analyser.getAverageFrequency() > 100)
	//
		// console.log(analyser.getAverageFrequency());
	renderer.render(scene, camera);

	// call the loop function again
	requestAnimationFrame(loop);
}

var scene,
		camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH,
		renderer, container;

function createScene() {
	// Get the width and the height of the screen,
	// use them to set up the aspect ratio of the camera 
	// and the size of the renderer.
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;

	// Create the scene
	scene = new THREE.Scene();

	// Add a fog effect to the scene; same color as the
	// background color used in the style sheet
	scene.fog = new THREE.Fog(0x081333, 100, 950);
	
	// Create the camera
	aspectRatio = WIDTH / HEIGHT;
	fieldOfView = 60;
	nearPlane = 1;
	farPlane = 10000;
	camera = new THREE.PerspectiveCamera(
		fieldOfView,
		aspectRatio,
		nearPlane,
		farPlane
		);
	
	// Set the position of the camera
	camera.position.x = 0;
	camera.position.z = 200;
	camera.position.y = 100;
	
	// Create the renderer
	renderer = new THREE.WebGLRenderer({ 
		// Allow transparency to show the gradient background
		// we defined in the CSS
		alpha: true, 

		// Activate the anti-aliasing; this is less performant,
		// but, as our project is low-poly based, it should be fine :)
		antialias: true 
	});

	// Define the size of the renderer; in this case,
	// it will fill the entire screen
	renderer.setSize(WIDTH, HEIGHT);
	
	// Enable shadow rendering
	renderer.shadowMap.enabled = true;
	
	// Add the DOM element of the renderer to the 
	// container we created in the HTML
	container = document.getElementById('world');
	container.appendChild(renderer.domElement);
	
	// Listen to the screen: if the user resizes it
	// we have to update the camera and the renderer size
	window.addEventListener('resize', handleWindowResize, false);
}

function handleWindowResize() {
	// update height and width of the renderer and the camera
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	renderer.setSize(WIDTH, HEIGHT);
	camera.aspect = WIDTH / HEIGHT;
	camera.updateProjectionMatrix();
}

var hemisphereLight, shadowLight;
var hemiBaseLightColor = 0x2375ac;
var hemiBaseDarkColor = 0x09153c;

// #09153c, #2375ac
function createLights() {
	// A hemisphere light is a gradient colored light; 
	// the first parameter is the sky color, the second parameter is the ground color, 
	// the third parameter is the intensity of the light
	hemisphereLight = new THREE.HemisphereLight(0x2375ac,0x09153c, .8)
	
	// A directional light shines from a specific direction. 
	// It acts like the sun, that means that all the rays produced are parallel. 
	shadowLight = new THREE.DirectionalLight(0xffffff, .9);

	// Set the direction of the light  
	shadowLight.position.set(150, 350, 350);
	
	// Allow shadow casting 
	shadowLight.castShadow = true;

	// define the visible area of the projected shadow
	shadowLight.shadow.camera.left = -400;
	shadowLight.shadow.camera.right = 400;
	shadowLight.shadow.camera.top = 400;
	shadowLight.shadow.camera.bottom = -400;
	shadowLight.shadow.camera.near = 1;
	shadowLight.shadow.camera.far = 1000;

	// define the resolution of the shadow; the higher the better, 
	// but also the more expensive and less performant
	shadowLight.shadow.mapSize.width = 2048;
	shadowLight.shadow.mapSize.height = 2048;
	
	// to activate the lights, just add them to the scene
	scene.add(hemisphereLight);  
	scene.add(shadowLight);
}



// First let's define a Sea object :
Sea = function(){
	var geom = new THREE.CylinderGeometry(600,600,800,40,10);
	geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));

	// important: by merging vertices we ensure the continuity of the waves
	geom.mergeVertices();

	// get the vertices
	var l = geom.vertices.length;

	// create an array to store new data associated to each vertex
	this.waves = [];

	for (var i=0; i<l; i++){
		// get each vertex
		var v = geom.vertices[i];

		// store some data associated to it
		this.waves.push({y:v.y,
										 x:v.x,
										 z:v.z,
										 // a random angle
										 ang:Math.random()*Math.PI*2,
										 // a random distance
										 amp:5 + Math.random()*15,
										 // a random speed between 0.016 and 0.048 radians / frame
										 speed:0.016 + Math.random()*0.032
										});
	};
	var mat = new THREE.MeshPhongMaterial({
		color:Colors.blue,
		transparent:true,
		opacity:.8,
		shading:THREE.FlatShading,
	});

	this.mesh = new THREE.Mesh(geom, mat);
	this.mesh.receiveShadow = true;

}

// now we create the function that will be called in each frame 
// to update the position of the vertices to simulate the waves

Sea.prototype.moveWaves = function (){
	
	// get the vertices
	var verts = this.mesh.geometry.vertices;
	var l = verts.length;
	
	for (var i=0; i<l; i++){
		var v = verts[i];
		
		// get the data associated to it
		var vprops = this.waves[i];
		
		// update the position of the vertex
		v.x = vprops.x + Math.cos(vprops.ang)*vprops.amp;
		v.y = vprops.y + Math.sin(vprops.ang)*vprops.amp;

		// increment the angle for the next frame
		vprops.ang += vprops.speed;

	}

	// Tell the renderer that the geometry of the sea has changed.
	// In fact, in order to maintain the best level of performance, 
	// three.js caches the geometries and ignores any changes
	// unless we add this line
	this.mesh.geometry.verticesNeedUpdate=true;

	sea.mesh.rotation.z += .0005;
}

// Instantiate the sea and add it to the scene:

var sea;

function createSea(){
	sea = new Sea();

	// push it a little bit at the bottom of the scene
	sea.mesh.position.y = -580;
	sea.mesh.position.x = 0;

	// add the mesh of the sea to the scene
	scene.add(sea.mesh);
}

var particles;
function createStars()
{
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	geometry = new THREE.Geometry();
	starCount = 1000;

	for (i = 0; i < starCount; i++) {

		var vertex = new THREE.Vector3();
		vertex.x = Math.random() * WIDTH - WIDTH / 2;
		vertex.y = Math.random() * HEIGHT - HEIGHT / 2 + 500;
		// vertex.z = Math.random() * 2000 - 1000;
		vertex.z = 0;

		geometry.vertices.push(vertex);
	}

	material = new THREE.PointsMaterial({ size: 1 });
	particles = new THREE.Points(geometry, material);
	scene.add(particles);
}

function moveStars()
{
	particles.position.x += 0.01;
}

Cube = function(){
	// var geom = new THREE.CubeGeometry(20,20,20);
 var geom = new THREE.DodecahedronGeometry(20,0)

	// important: by merging vertices we ensure the continuity of the waves


	var mat = new THREE.MeshPhongMaterial({
		color:0xffffff,
		transparent:false,
		opacity:.8,
		shading:THREE.FlatShading,
	});

	this.mesh = new THREE.Mesh(geom, mat);
	this.mesh.castShadow = true;
	this.mesh.receiveShadow = true;

}

Cube.prototype.moveCube = function() {
	cube.mesh.rotation.x += 0.005;
	cube.mesh.rotation.y += 0.003;
	cube.mesh.scale.x =  1 + 1.2 * analyser.getAverageFrequency() / 100.0;
	cube.mesh.scale.y =  1 + 1.2 * analyser.getAverageFrequency() / 100.0;
	cube.mesh.scale.z =  1 + 1.2 * analyser.getAverageFrequency() / 100.0;
}

var cube;
function createCube()
{
	cube = new Cube();
	cube.mesh.scale.x = 2;
	cube.mesh.scale.y = 2;
	cube.mesh.scale.z = 2;
	cube.mesh.position.y = 100;
	cube.mesh.rotation.x = 0.5;
	cube.mesh.rotation.y = 0.4;
	// cube.mesh.position.x = 100;
	// cube.mesh.position.z = 10;
	scene.add(cube.mesh);
}

// cloud
Cloud = function(){
	// Create an empty container that will hold the different parts of the cloud
	this.mesh = new THREE.Object3D();
	
	// create a cube geometry;
	// this shape will be duplicated to create the cloud
	var geom = new THREE.BoxGeometry(20,20,20);
	
	// create a material; a simple white material will do the trick
	var mat = new THREE.MeshPhongMaterial({
		color:Colors.white,  
	});
	
	// duplicate the geometry a random number of times
	var nBlocs = 3+Math.floor(Math.random()*3);
	for (var i=0; i<nBlocs; i++ ){
		
		// create the mesh by cloning the geometry
		var m = new THREE.Mesh(geom, mat); 
		
		// set the position and the rotation of each cube randomly
		m.position.x = i*15;
		m.position.y = Math.random()*10;
		m.position.z = Math.random()*10;
		m.rotation.z = Math.random()*Math.PI*2;
		m.rotation.y = Math.random()*Math.PI*2;
		
		// set the size of the cube randomly
		var s = .1 + Math.random()*.9;
		m.scale.set(s,s,s);
		
		// allow each cube to cast and to receive shadows
		m.castShadow = true;
		m.receiveShadow = true;
		
		// add the cube to the container we first created
		this.mesh.add(m);
	} 
}

// Define a Sky Object
Sky = function(){
	this.mesh = new THREE.Object3D();
	
	this.nClouds = 20;
	
	var stepAngle = Math.PI*2 / this.nClouds;
	
	for(var i=0; i<this.nClouds; i++){
		var c = new Cloud();
	 
		var a = stepAngle*i; // this is the final angle of the cloud
		var h = 750 + Math.random()*200; // this is the distance between the center of the axis and the cloud itself

		c.mesh.position.y = Math.sin(a)*h;
		c.mesh.position.x = Math.cos(a)*h;

		c.mesh.rotation.z = a + Math.PI/2;

		c.mesh.position.z = -400-Math.random()*400;
		
		var s = 1+Math.random()*2;
		c.mesh.scale.set(s,s,s);

		this.mesh.add(c.mesh);  
	}  
}

Sky.prototype.moveSky = function() {
	this.mesh.rotation.z += 0.0003;
}

// Now we instantiate the sky and push its center a bit
// towards the bottom of the screen

var sky;

function createSky(){
	sky = new Sky();
	sky.mesh.position.y = -600;
	scene.add(sky.mesh);
}
