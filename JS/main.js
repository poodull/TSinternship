	
//////////	
// MAIN //
//////////
// standard global variables
var container, scene, camera, renderer, controls, stats;
var clock = new THREE.Clock(); 
var mouse = new THREE.Vector2(),offset = new THREE.Vector3(),
			INTERSECTED, SELECTED;;
var raycaster = new THREE.Raycaster();
var Points = [],Remove = false;
var Removed = [];

window.requestAnimFrame = (function() {
     return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
              function(/* function */ callback, /* DOMElement */ element)
              {
                    window.setTimeout(callback, 1000 / 60);
              };
            })();
// initialization
init();

// animation loop 
animate();

//necessary functions
function init() {
	//Create the scene
	scene = new THREE.Scene();
	
	// set the view size in pixels (custom or according to window size)
	// var SCREEN_WIDTH = 400, SCREEN_HEIGHT = 300;
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;	
	// camera attributes
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	// set up camera
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	// add the camera to the scene
	scene.add(camera);
	// the camera defaults to position (0,0,0)
	// 	so pull it back (z = 400) and up (y = 100) and set the angle towards the scene origin
	camera.position.set(0,150,400);
	camera.lookAt(scene.position);	
	
	// create and start the renderer; choose antialias setting.
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer(); 
	
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	
	// attach div element to variable to contain the renderer
	container = document.getElementById( 'ThreeJS' );
    
	// alternatively: to create the div at runtime, use:
	//   container = document.createElement( 'div' );
	//    document.body.appendChild( container );
	
	// attach renderer to the container div
	container.appendChild( renderer.domElement );
	
	

	// move mouse and: left   click to rotate, 
	//                 middle click to zoom, 
	//                 right  click to pan
	controls = new THREE.OrbitControls( camera, renderer.domElement );

	// displays current and past frames per second attained by scene
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );

	// create a light
	var light = new THREE.PointLight(0xffffff);
	light.position.set(0,250,0);
	scene.add(light);
	//var ambientLight = new THREE.AmbientLight(0x111111);
	// scene.add(ambientLight);
    // create a set of coordinate axes to help orient user
	//    specify length in pixels in each direction
//	var axes = new THREE.AxisHelper(100);
	//scene.add( axes );

	// note: Office Image/Plane Background
	var floorTexture = new THREE.ImageUtils.loadTexture( 'Assets/Images/NewOfficeTS.png' );
	var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, 
                                                      side: THREE.DoubleSide,
                                                     // blending: THREE.Normal,//THREE.AdditiveAlpha,
                                                      transparent: true
                                                     } );
	var floorGeometry = new THREE.PlaneBufferGeometry(1000, 1000, 1, 1);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = 0;
	floor.rotation.x = Math.PI / 2;
	scene.add(floor);
    DrawPoints();

	// recommend either a skybox or fog effect (can't use both at the same time) 
	// without one of these, the scene's background color is determined by webpage background
	// make sure the camera's "far" value is large enough so that it will render the skyBox!
	//var skyBoxGeometry = new THREE.BoxGeometry( 10000, 10000, 10000 );
	// BackSide: render faces from inside of the cube, instead of from outside (default).
	//var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
	//var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
	//scene.add(skyBox);
    
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'touchstart', onDocumentTouchStart, false );
    document.addEventListener( 'keydown', OnKeyDown, false );
    window.addEventListener( 'resize', onWindowResize, false );


	// fog must be added to scene before first render
	scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );
}

//Events(Keypresses and Mouse functions)
function onDocumentTouchStart( event ) {				
    event.preventDefault();
    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;
    onDocumentMouseDown( event );
    }	
function onDocumentMouseDown( event ) {
    event.preventDefault();
    mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.height ) * 2 + 1;
    //AddPoint();
    RemovePoint();
    }
    
function onDocumentMouseMove( event ) {

    //event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );

}
    
function OnKeyDown( event ) {
    switch(event.keyCode)
    {
        case 46: // 'DELETE' Key, Toggle delete selected point
            Remove = !Remove; 
            break;
        case 45: //'INSERT' Key, add one single point
            AddPoint();
            break;
        case 35:
            RemovePoints(); //Remove point when clicked!
            break;

    }
}
//Hide points from renderer
function RemovePoints() {
    for (var r = 0; r < Points.length; r++) {
        scene.remove(Points[r]);
    }
}
//Mouse hover check
//TODO: Doesn't work atm, overlapped by mouse click function
function FindIntersects() {
    raycaster.setFromCamera(mouse, camera);
    //The intersects are the points we are checking if the mouse  hovers over.
    var intersects = raycaster.intersectObjects(Points),material;
    //If there are points to check, then we can animate them.
    if (intersects.length > 0) {
     //Intersected is the current mouse selection.
        if (INTERSECTED != intersects[0].object) {
            //If we have an intersection, we check if we can change the color or light
            if (INTERSECTED) {
                material = INTERSECTED.material;
                //If the material emits light, we can change the color in hex.
                if (material.emissive) {
                    material.emissive.setHex(INTERSECTED.currentHex);
                }
                //If not, try to change the color of the material.
                else {
                        material.color.setHex(INTERSECTED.currentHex);   
                    }
            }
                           
                        
            INTERSECTED = intersects[0].object;
            material = INTERSECTED.material;
            console.log(INTERSECTED);
            if(material.emissive) {
                INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                material.emissive.setHex(0xff0000);                            
            }
            else {
                INTERSECTED.currentHex = material.color.getHex();
                material.color.setHex(0xff0000);
            }
        }

        }
        //Reset back to original color
        else {
                if (INTERSECTED){
                    material = INTERSECTED.material;
                        if(material.emissive) {
                            material.emissive.setHex(INTERSECTED.currentHex);
                        }
                        else {
                            material.color.setHex(INTERSECTED.currentHex);
                        }
                    }
                    INTERSECTED = null;
                }
    }
function tweenAlphaOut( mesh ) {
        TWEEN.removeAll();
        new TWEEN.Tween( mesh.material ).to( {
						opacity:0 }, 10000 ).easing( TWEEN.Easing.Elastic.Out).start();
                /*new TWEEN.Tween( IntersectedPoint.scale ).to( {
						x:1,
                        y:1,
                        z:1
                }, 3000 ).easing( TWEEN.Easing.Elastic.Out).start();*/
    }
				
function tweenAlphaIn( mesh ) {
        new TWEEN.Tween( mesh.scale ).to( {
            x:2,
            y:2,
            z:2
        }, 3000 ).easing( TWEEN.Easing.Elastic.Out).start();
    }
//Add a single point to the plane.
//TODO: Take input or load new json file with data and render
function GenerateCube()
{
    var geo_Cube = new THREE.BoxGeometry( 5, 5, 5 );
    var mat_Cube = new THREE.MeshLambertMaterial({
                            color: Math.random() * 0xffffff,
                            transparent: true,
                            opacity:0.8});
    
    var mesh_NewPoint = new THREE.Mesh( geo_Cube,mat_Cube );
    
    mesh_NewPoint.position.x = Math.random() * 1000 - 500;
    mesh_NewPoint.position.y = 2;
    mesh_NewPoint.position.z = Math.random() * 800 - 400;
    return mesh_NewPoint;
}
function AddPoint() {

    var mesh_Cube = GenerateCube();
    scene.add( mesh_Cube );
    tweenAlphaIn( mesh_Cube );
    Points.push( mesh_Cube );
    }
function DrawPoints() {
	// most objects displayed are a "mesh":
	//  a collection of points ("geometry") and
	//  a set of surface parameters ("material")    
    var numPoints = 3000;
    var mesh_Box;
    for (var i = 0; i < numPoints; i++)
    {
        AddPoint();
    }
    }
//Remove selected point on click
function RemovePoint() {
    var deleted = [];
    raycaster.setFromCamera(mouse, camera);
    //The intersects are the points we are checking if the mouse  hovers over.
    var intersects = raycaster.intersectObjects(Points),material;
    //If there are points to check, then we can animate them.
    if (intersects.length > 0) {
     //Intersected is the current mouse selection.
        if (INTERSECTED != intersects[0].object) {
            //If we have an intersection, we check if we can change the color or light
            if (INTERSECTED) {
                material = INTERSECTED.material;
                //scene.remove(INTERSECTED);
                //If the material emits light, we can change the color in hex.
                if (material.emissive) {
                    material.emissive.setHex(INTERSECTED.currentHex);
                    
                }
                //If not, try to change the color of the material.
                else {
                        material.color.setHex(INTERSECTED.currentHex);   

                    }
            }
            
            INTERSECTED = intersects[0].object;
            material = INTERSECTED.material;
           
           if (Remove){ 
                tweenAlphaOut(INTERSECTED);} //Ease out on clock, not completely functional
                                             //TODO:figure out how to render as opacity changes
           // Removed.push(INTERSECTED);    //Add to vector of deleted nodes.

            
            if(material.emissive) {
                INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                material.emissive.setHex(0xff0000);   
                
            }
            else {
                INTERSECTED.currentHex = material.color.getHex();
                material.color.setHex(0xff0000);
            }
        }
        }
    }

function animate() {
    window.requestAnimFrame(animate);
	render();		
	update();
}

function update() {
	// delta = change in time since last call (in seconds)
	//var delta = clock.getDelta(); 
	controls.update();
	stats.update();
}

function render() {
    TWEEN.update();
    //FindIntersects();
   	renderer.render( scene, camera );
}
