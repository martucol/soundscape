/*
/// credits to three.js webgl 3d sounds example  : https://threejs.org/examples/#misc_sound
/// credits to recorder.js : https://github.com/mattdiamond/Recorderjs


// to do 
- funcion constructora de objetos ( record, sound spacialization & three js)
- cambiar controles a unos mas basicos (flechitas y mouse, dejando el click libre)
- click en grid three js para posicionamiento de sonidos (x y)
- cuando se graba , lo demas se mutea 
- limite de grabacion 3 s .
*/


// funcionamiento landing page 
var landing = document.querySelector("#landing");
var container = document.querySelector("#container");
var controles = document.querySelector("#control");
var botonComenzar = document.querySelector("#comenzar");
var botonGrabar = document.querySelector("#record");
var botonParar = document.querySelector("#stop");
var muteBtn = document.querySelector("#muteFav");
var toggleBtn = document.querySelector("#toggleFav");

container.style.visibility="hidden";
controles.style.visibility="hidden";

// declaración de variables básicas 
var start = Date.now()
var muted, view;
var container;
var camera, controls, scene, renderer;
var clock = new THREE.Clock();
// create audio context
var audio_context, mixer;
var streamDestination;
/// create recorder for mic
var recorder;
/// create streamDestinationNode and Media Recorder for download
var streamDest, mediaRec;
var esferas = {};
var bola;
// variables a modificar 
var light, pointLight, ambientLight;
var mesh, bulbMat;
var shadermaterial;
var material_sphere1, material_sphere2;
var sonidos = [];
var sound1, sound2;
var currentPosition = (0,0,0);
var limit;




function cambioEstilo(){		
		 container.style.visibility="visible";
		 landing.style.display="none";
		 controles.style.visibility="visible";
};

function info(){
		 container.style.visibility="hidden";
		 landing.style.display="block";
		 controles.style.visibility="hidden";
};

function mute(){
	if (muted == false) {
		mixer.gain.value = 0 ;
		muted = true;
		muteBtn.classList.remove('fa-volume-up');
		muteBtn.classList.add('fa-volume-off');
		console.log(muted);
	} else if (muted == true) {
		mixer.gain.value = 1;
		muted = false;
		muteBtn.classList.remove('fa-volume-off');
		muteBtn.classList.add('fa-volume-up');
		console.log(muted);
	}
}

function toggleView(){
	if (view == false) {
		scene.add(bola) ;
		view = true;
		toggleBtn.classList.remove("fa-thermometer-empty");
		toggleBtn.classList.add('fa-thermometer');

	} else if (view == true) {
		scene.remove(bola);
		view = false;
		toggleBtn.classList.remove('fa-thermometer-full');
		toggleBtn.classList.add('fa-thermometer-empty');

	}
}

// ----------  funciones de recorder js --------
function __log(e, data) {
    log.innerHTML += "\n" + e + " " + (data || '');
 }

 function startUserMedia(stream) {
    var input = audioCtx.createMediaStreamSource(stream);
    __log('Media stream created.');
    recorder = new Recorder(input);
    __log('Recorder initialised.');

 }




 function startRecordingSound(button) {
    recorder && recorder.record();
    button.disabled = true;
    button.classList.add('active');
    button.nextElementSibling.disabled = false;
    __log('Recording...');
    mixer.gain.value = 0;

 }

 function stopRecordingSound(button) {
    recorder && recorder.stop();
    button.disabled = true;
    button.previousElementSibling.disabled = false;
    button.previousElementSibling.classList.remove('active');
    __log('Stopped recording.');
    
    // create WAV sound object 
    createSoundObject(currentPosition);
  
    recorder.clear();
    mixer.gain.value = 1;
 }

////  funcion para descargar sonidos --------------------------
function startRecordingPath(button) {
    mediaRec.startRecording();
    button.disabled = true;
    button.nextElementSibling.disabled = false;
    console.log("started recording path");

 }

 function stopRecordingPath(button) {
  	mediaRec.finishRecording();
    button.disabled = true;
    button.previousElementSibling.disabled = false;
    console.log("stopped recording path");
   
 }



//función de reproducción de sonido en el espacio
var Sound = function ( sources, volume , x, y , z ) {
	var audio = document.createElement( 'audio' );
	for ( var i = 0; i < sources.length; i ++ ) {
		var source = document.createElement( 'source' );
		source.src = sources[ i ];
		audio.appendChild( source );
	}

	var request = new XMLHttpRequest();
	request.open("GET", sources, true);
	request.responseType = "arraybuffer";
	request.onload = function(e) {
	  	// Create a buffer from the response ArrayBuffer.
	  	audioCtx.decodeAudioData(this.response, function onSuccess(buffer) {
		    sound.buffer = buffer;

		    // Make the sound source use the buffer and start playing it.
		    sound.source.buffer = sound.buffer;
		    sound.source.start(audioCtx.currentTime);
		    console.log("play");
		    console.log(sound.buffer);
	  	}, function onFailure() {
	    	alert("Decoding the audio buffer failed");
	  	});
	};
	request.send();

	this.position = new THREE.Vector3();
	this.play = function () {
		audio.play();
	}
	var sound = {};
	sound.source = audioCtx.createBufferSource(audio);
	sound.volume = audioCtx.createGain();
	sound.panner = audioCtx.createPanner();
	sound.panner.distanceModel = "exponential";
	sound.panner.coneInnerAngle = 360;
	sound.panner.refDistance = 2.5;
	sound.panner.maxDistance = 500;

	
	sound.source.connect(sound.volume);
	sound.volume.connect(sound.panner);
	sound.panner.connect(mixer);

	sound.source.loop = true;
	sound.panner.setPosition(x, y, z);
	var material = new THREE.MeshLambertMaterial({color: 0x000000});
	material.color.setHSL(Math.random() , 0.2, 0.5 );
	var esfera = new THREE.Mesh( new THREE.SphereGeometry(5, 32, 32),material);
	esfera.position.set(x,y+2,z);
	scene.add(esfera);

}



/// Creacion de objeto sound a partir de la grabacion 
function createSoundObject(position) {
    recorder && recorder.exportWAV(function(blob) {
	    var url = URL.createObjectURL(blob);

	    var sound ;
	     sound = new Sound( [ url ],  1 , camera.position.x , camera.position.y, camera.position.z);
		
	     sound.play();
	     sonidos.push(sound);


       
    });
  }

function init() {

	// set up basico audio context
	 try {
      // webkit shim
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
      window.URL = window.URL || window.webkitURL;
      
      audioCtx = new AudioContext;
      __log('Audio context set up.');
      __log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
      alert('No web audio support in this browser!');
    }
    
    navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
      __log('No live audio input: ' + e);
    });

    if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

     mixer = audioCtx.createGain();
     mixer.connect(audioCtx.destination);
    /*
    streamDest = audioCtx.createMediaStreamDestination();
   
    mixer.connect(streamDest);
    streamDest.connect(audioCtx.destination);
    mediaRec = new WebAudioRecorder(mixer, { workerDir: "build/"});
    */


	// set up basico de la escena
	container = document.getElementById( 'container' );
	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.set( 0, 25, 0 );
	controls = new THREE.FirstPersonControls( camera );
	controls.movementSpeed = 100;
	controls.lookSpeed = 0.07;
	controls.noFly = true;
	controls.lookVertical = false; 
	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2( 0x000000, 0.0015 );


	// luz general
	light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 0, 0.5, 1 ).normalize();
	scene.add( light );

	ambientLight = new THREE.AmbientLight( 0xff5555 , 0.5);
	scene.add(ambientLight);
	// objeto lumínico y sonoro ( esto va a la función )
	
	// ground
	// quizas sirva más este para seleccionar coordenadas
	shadermaterial = new THREE.ShaderMaterial({side: THREE.DoubleSide,
						uniforms: { amp: {
										type: "f",
										value: 0.0
									},
									sync:{
										type: "f",
										value: 0.0
									},
						            time: { //float initialized to 0
						                type: "f",
						                value: 0.0
					             	 }
			            },
			            vertexShader: document.getElementById('vertexShader2').textContent,
			            fragmentShader: document.getElementById('fragmentShader2').textContent
	} );

	var material_wireframe = new THREE.MeshLambertMaterial( { color: 0x000000, wireframe: true, wireframeLinewidth: 10 } );
	//material_wireframe.color.setHSL( 0.1, 0.2, 0.5 );
	
	mesh = new THREE.Mesh( new THREE.PlaneGeometry( 1000, 1000, 50, 50 ), material_wireframe );
	mesh.position.y = 0.1;
	mesh.rotation.x = - Math.PI /2;

	bola = new THREE.Mesh(new THREE.SphereGeometry(1000, 32, 32), shadermaterial);

	var grid = new THREE.GridHelper( 500, 25 );
	grid.setColors( 0xffaaff, 0xffaaff );
	scene.add( grid );
	
	// renderer setup and adding to HTML
	renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 1, antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.innerHTML = "";
	container.appendChild( renderer.domElement );
	//
	window.addEventListener( 'resize', onWindowResize, false );
	muted = false; 
	view = false;
	limit = 500;
}



function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	controls.handleResize();
}
function animate() {
	requestAnimationFrame( animate );
	render();
}
function render() {
	var delta = clock.getDelta(),
		time = clock.getElapsedTime() * 5;
	controls.update( delta );
	renderer.render( scene, camera );
	audioCtx.listener.setPosition(camera.position.x, camera.position.y, camera.position.z);

	//limit camera movement
	if (camera.position.x > limit) {
		camera.position.x = limit;
	}
	if (camera.position.x < -limit) {
		camera.position.x = -limit;
	}
	if (camera.position.z > limit) {
		camera.position.z = limit;
	}
	if (camera.position.z < -limit) {
		camera.position.z = -limit;
	}
	if (camera.position.y < 20) {
		camera.position.y = 20;
	}

	shadermaterial.uniforms[ 'time' ].value = .0005 * ( Date.now() - start );
	shadermaterial.uniforms[ 'amp' ].value = ( Date.now() - start ) / 70 ;


	var m = camera.matrix;

	var mx = m.elements[12], my = m.elements[13], mz = m.elements[14];
	m.elements[12] = m.elements[13] = m.elements[14] = 0;

	// Multiply the orientation vector by the world matrix of the camera.
	var vec = new THREE.Vector3(0,0,1);
	vec.applyProjection(m);
	vec.normalize();

	// Multiply the up vector by the world matrix.
	var up = new THREE.Vector3(0,-1,0);
	up.applyProjection(m);
	up.normalize();

	// Set the orientation and the up-vector for the listener.
	audioCtx.listener.setOrientation(vec.x, vec.y, vec.z, up.x, up.y, up.z);

	m.elements[12] = mx;
	m.elements[13] = my;
	m.elements[14] = mz;


}

/*

var n = 20;
var objects = [];

function creadora(posicion, url) {
	var objeto = {}.
	objeto.x =
	objeto.y =
	objeto.url = etc

	objects.push(objeto)
}

*/


init();
animate();