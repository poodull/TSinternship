//////////
// MAIN //
//////////
var dataset = [];
// standard global variables
var container, scene, camera, renderer, controls, stats;
var mouse = new THREE.Vector2(), offset = new THREE.Vector3(),
    INTERSECTED, SELECTED;
;
var raycaster = new THREE.Raycaster();
var Points = [], Remove = false;
var Pumping = false;
var Loading = true;

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
    var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 10, FAR = 80000;
    // set up camera
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    // add the camera to the scene
    scene.add(camera);
    // the camera defaults to position (0,0,0)
    // 	so pull it back (z = 400) and up (y = 100) and set the angle towards the scene origin
    camera.position.set(0, 1500, 4000);
    camera.lookAt(scene.position);

    // create and start the renderer; choose antialias setting.
    if (Detector.webgl)
        renderer = new THREE.WebGLRenderer({antialias: true});
    else
        renderer = new THREE.CanvasRenderer();

    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

    // attach div element to variable to contain the renderer
    container = document.getElementById('ThreeJS');

    // alternatively: to create the div at runtime, use:
    //   container = document.createElement( 'div' );
    //    document.body.appendChild( container );

    // attach renderer to the container div
    container.appendChild(renderer.domElement);


    // move mouse and: left   click to rotate,
    //                 middle click to zoom,
    //                 right  click to pan
    controls = new THREE.OrbitControls(camera, renderer.domElement);

    // displays current and past frames per second attained by scene
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = 100;
    container.appendChild(stats.domElement);


    var ambientLight = new THREE.AmbientLight(0x111111);
    scene.add(ambientLight);
    // create a set of coordinate axes to help orient user
    //    specify length in pixels in each direction


    // note: Office Image/Plane Background
    //import image and deserialize
    LoadData();
    // recommend either a skybox or fog effect (can't use both at the same time)
    // without one of these, the scene's background color is determined by webpage background
    // make sure the camera's "far" value is large enough so that it will render the skyBox!
    var skyBoxGeometry = new THREE.SphereGeometry(20000, 100, 100) //20000, 20000 );
    // BackSide: render faces from inside of the cube, instead of from outside (default).
    var skyBoxMaterial = new THREE.MeshBasicMaterial({color: 0x9999ff, side: THREE.BackSide});
    var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
    scene.add(skyBox);

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('touchstart', onDocumentTouchStart, false);
    document.addEventListener('keydown', OnKeyDown, false);
    window.addEventListener('resize', onWindowResize, false);

    // fog must be added to scene before first render
    // scene.fog = new THREE.FogExp2(0x9999ff, 0.00025);
}

//Events(Keypresses and Mouse functions)
function onDocumentTouchStart(event) {
    event.preventDefault();
    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;
    onDocumentMouseDown(event);
}
function onDocumentMouseDown(event) {
    event.preventDefault();
    mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
    mouse.y = -( event.clientY / renderer.domElement.height ) * 2 + 1;
    //AddPoint();
    RemovePoint();
}
function onDocumentMouseMove(event) {
    //event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

}

function OnKeyDown(event) {
    switch (event.keyCode) {
        case 46: // 'DELETE' Key, Toggle delete selected point
            Remove = !Remove;
            break;
        case 45: //'INSERT' Key, add one single point
            AddPoint();
            break;
        case 35:
            //
            // RemovePoints(); //Remove point when clicked!
            break;
        case 76: //'l'
            for (var i = 0; i < Points.length; i++) {
                new AnimationHandler(Points, i);
            }
            break;

    }
}

function ImportFloorImage(floor_data, floor_id) {
    return floor_data[floor_id].image;
}

function CreateFloor(dataset, FloorNumber, FloorDimensions) {


    var CurrentFloor = dataset[FloorNumber];
    var image = ImportFloorImage(dataset, FloorNumber);

    var floorPlan = "data:image/png;base64," + image; //'Assets/Images/NewOfficeTS.png';
    var floorTexture = new THREE.ImageUtils.loadTexture(floorPlan);
    var floorMaterial = new THREE.MeshBasicMaterial({
        map: floorTexture,
        side: THREE.DoubleSide,
        //blending: THREE.AdditiveBlending,//THREE.AdditiveAlpha,
        transparent: true,
        depthWrite: false,
        frustumCulled: false
        //   depthTest:false
    });
    var ImageHeight = 1985, ImageWidth = 995;
    var floorGeometry = new THREE.PlaneBufferGeometry(ImageWidth, ImageHeight, 1, 1);
    var FloorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    var baseFloor = dataset[0];
    //console.log(baseFloor);
    FloorMesh.scale.set(CurrentFloor.scale, CurrentFloor.scale, CurrentFloor.scale);
    //Set the position
    var altitude = parseInt(CurrentFloor.altitude);
    var b_offset_z = parseInt(CurrentFloor.building_offset_z);
    var origin_x = parseInt(CurrentFloor.origin_x);
    var origin_y = parseInt(CurrentFloor.origin_y);
    var base_origin_x = parseInt(baseFloor.origin_x);
    var base_origin_y = parseInt(baseFloor.origin_y);

    //Check if this is the base floor, so we don't move it too much
    //should add a check to see if we are in the same building and if we are, figure which one is the base floor
    //then move the other floors relative to the base floor.
    if (FloorNumber == 0) {
        origin_x = 0;
        origin_y = 0;
    }
    FloorMesh.position.x = base_origin_x + origin_x;//CurrentFloor.building_offset_x + CurrentFloor.origin_x;
    FloorMesh.position.z = base_origin_y + origin_y;
    FloorMesh.position.y = altitude;// + b_offset_z;
    //Keep the plane flat on XZ axis!
    FloorMesh.rotation.x = Math.PI / 2;

    var origin = new THREE.AxisHelper(200);
    origin.position.x = base_origin_x;
    origin.position.y = FloorMesh.position.y;
    origin.position.z = base_origin_y;

    var hex = 0xff0000;
    var CurrentFloorDimensions = [];
    // var fbox = new THREE.BoundingBoxHelper(Floor, hex);
    var FloorGeometry = FloorMesh.geometry;
    FloorGeometry.computeBoundingBox();

    CurrentFloorDimensions["width"] = FloorGeometry.boundingBox.max.x - FloorGeometry.boundingBox.min.x;
    CurrentFloorDimensions["height"] = FloorGeometry.boundingBox.max.y - FloorGeometry.boundingBox.min.y;
    CurrentFloorDimensions["depth"] = FloorGeometry.boundingBox.max.z - FloorGeometry.boundingBox.min.z;
    CurrentFloorDimensions["min_x"] = FloorGeometry.boundingBox.min.x + origin_x + base_origin_x;
    CurrentFloorDimensions["max_x"] = FloorGeometry.boundingBox.max.x + origin_x + base_origin_x;
    CurrentFloorDimensions["min_y"] = FloorGeometry.boundingBox.min.y + origin_y + base_origin_y;
    CurrentFloorDimensions["max_y"] = FloorGeometry.boundingBox.max.y + origin_y + base_origin_y;
    FloorDimensions.push(CurrentFloorDimensions);
    var inputCircles = prompt("Floor # " + FloorNumber + ": How many circles? ");

    EventPublisher(CurrentFloorDimensions["min_x"], CurrentFloorDimensions["max_x"],
                   CurrentFloorDimensions["min_y"], CurrentFloorDimensions["max_y"],
                   FloorMesh, CurrentFloor, inputCircles, scene);
    // fbox.update();
    //scene.add(fbox);
    //Add custom lighting function later
    var light1 = new THREE.PointLight(0xffffff);
    light1.position.set(base_origin_x + origin_x, FloorMesh.position.y + 250, base_origin_y + origin_y);
    // console.log(light1.position);
    scene.add(light1);
    scene.add(origin);
    scene.add(FloorMesh);
}

function LoadFloors(data, FloorNumber) {
    var FloorDimensions = [];
    for (var i = 0; i < FloorNumber; i++) {
        CreateFloor(data, i, FloorDimensions);
        //console.log(FloorDimensions);
    }
}

function LoadData() {

    LoadFloorPlan(dataset, function (result) {
        // console.log(result);
        var numFloors = result.length;

        var inputFloors = prompt("There are " + numFloors + " floor maps available, how many would you like to load?");
        if (inputFloors <= numFloors + 1) {
            alert("Loading...");
            LoadFloors(result, inputFloors);
        }
        Loading = false;
        //  CreateFloor(result);
    });
}
//TODO: turn this into a class

//Mouse hover check
//TODO: Doesn't work atm, overlapped by mouse click function
function FindIntersects() {
    raycaster.setFromCamera(mouse, camera);
    //The intersects are the points we are checking if the mouse  hovers over.
    var intersects = raycaster.intersectObjects(Points), material;
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

            //Reset the color back to normal when we select a different object
            INTERSECTED = intersects[0].object;
            material = INTERSECTED.material;
            //console.log(INTERSECTED);
            if (material.emissive) {
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
        if (INTERSECTED) {
            material = INTERSECTED.material;
            if (material.emissive) {
                material.emissive.setHex(INTERSECTED.currentHex);
            }
            else {
                material.color.setHex(INTERSECTED.currentHex);
            }
        }
        INTERSECTED = null;
    }
}

//Add a single point to the plane.
function RemovePoint() {
    var deleted = [];
    raycaster.setFromCamera(mouse, camera);
    //The intersects are the points we are checking if the mouse  hovers over.
    var intersects = raycaster.intersectObjects(Points), material;
    //If there are points to check, then we can animate them.
    var intersects_length = intersects.length;
    if (intersects_length > 0) {
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

            if (Remove) {
                tweenAlphaOut(INTERSECTED);
            } //Ease out on clock, not completely functional
              //TODO:figure out how to render as opacity changes
            // Removed.push(INTERSECTED);    //Add to vector of deleted nodes.


            if (material.emissive) {
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
//Main animation class
function GenerateRandomValue(min,max) {
    var random = Math.floor(Math.random() * (max - min) + min);// * FloorScale;
    return random;
}
//Instantiate one for each point, allowing control of the sequences of animations
function CreateTween(Circle) {
    var anims = [];
    var circle = Circle;
    var time = new THREE.Clock();

    //TODO: Convert the tweens into class variables so we can call each animation on THIS
    var tweenOut = new TWEEN.Tween(circle.material)
        .to({
            opacity: 0.0,
            duration: 0.5,
            radius: 0,
            delay:0
        })
        .easing(TWEEN.Easing.Linear.None)
        .onComplete(function () {
            tweenIn.start();
            //tweenOut.stop();
            //console.log("tween out complete: ");
        });
    var tweenSizeIn = new TWEEN.Tween(circle.scale)
        .to({
            x: 1,
            y: 1,
            z: 1
        }, 3000).easing(TWEEN.Easing.Bounce.Out);
    var tweenSizeOut = new TWEEN.Tween(circle.scale)
        .to({
            x: 0,
            y: 0,
            z: 0
        }, 500)
        .easing(TWEEN.Easing.Bounce.Out);


    var tweenIn = new TWEEN.Tween(circle.material)
        .to({
            opacity: 0.8,
            duration: 5,
            delay: 3000
        })

        .easing(TWEEN.Easing.Exponential.In)
        .onComplete(function () {
            // console.log("tween in complete: ");
       //     tweenOut.delay(3000);
          //  console.log("Tween out Time: " + time.getDelta());

            // DWELL PERIOD //
            tweenOut.start();
            // setTimeout(tweenOut.start(),3000);
        });
    var tweenMoveOut = new TWEEN.Tween(circle.position)
        .to({
            x: GenerateRandomValue(-1500,1500),
            z: GenerateRandomValue(-7000,7000),
            duration: 0.5,
            delay: 3000
            });

       /* .onComplete(function() {

            tweenMove.delay(3000);
            tweenMove.repeat(Infinity);
    });*/
    var tweenMove = new TWEEN.Tween(circle.position)
        .to({
            x: GenerateRandomValue(-1500,1500),
            z: GenerateRandomValue(-7000,7000),
            duration: 0.5,
            delay: 3000
        })
        .onComplete(function() {
            tweenMove.repeat(Infinity);
        });

    tweenIn.chain(tweenSizeIn);

    anims["start"] = tweenIn;
    //tweenOut ;//.chain(tweenAlphaSizeOut);
    anims["end"] = tweenOut;
    anims["start"].start();
    tweenMoveOut.chain(tweenMove);
    tweenMoveOut.start();
}
function AnimationQueue() {
    this.Animations = [];
    this.Queue = [];
    this.Actives = [];
    // this.GetTween = function(Animation) {
    //     this.Animations.push(Animation);
    //create  };
    this.Enqueue = function (Object) {
        // this.tween = (CreateTween(Object));
        this.Animations.push(this.tween);
        this.Queue.push(Object);
        this.Actives[this.Queue.indexOf(Object)] = false;
    };
    this.UpdateQueue = function () {
        return this.Queue;
    };
    this.Animate = function () {
        var FirstPriority = this.Queue[this.Queue.length-1];
        if (!this.Actives[FirstPriority]) {
            //this.Actives[FirstPriority] = true;
           // FirstPriority -= 1;
            console.log(this.Queue);
            this.popped = this.Queue.pop();
            CreateTween(this.popped);
            console.log(this.Queue);
        }
      /*  for (var i = 0; i < this.Actives.length; i++) {
            if (!this.Actives[i]) {
                console.log(this.Actives[i]);
                CreateTween(this.Queue[i]);
                this.Actives[i] = true;
            }
        }*/
    }

}
function AnimateAll() {
    //While updating

    //Take the queue

    //Loop through the que

    //Create a tween for each object

    //Animate Tween

}
function animate() {
    requestAnimationFrame(animate);
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
    renderer.render(scene, camera);
}
