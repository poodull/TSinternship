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
var Loading = true;
var que;
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
            break;

    }
}

function ImportFloorImage(floor_data, floor_id) {
    return floor_data[floor_id].image;
}

function CreateFloor(dataset, FloorNumber, FloorDimensions) {


    var CurrentFloor = dataset[FloorNumber];
    var image = ImportFloorImage(dataset, FloorNumber);

    var FloorPlan = "data:image/png;base64," + image; //'Assets/Images/NewOfficeTS.png';
    var FloorTexture = new THREE.ImageUtils.loadTexture(FloorPlan);
    var FloorMaterial = new THREE.MeshBasicMaterial({
        map: FloorTexture,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        frustumCulled: false
    });
    var ImageHeight = 1985, ImageWidth = 995;
    var FloorGeometry = new THREE.PlaneBufferGeometry(ImageWidth, ImageHeight, 1, 1);
    var FloorMesh = new THREE.Mesh(FloorGeometry, FloorMaterial);
    FloorMesh.scale.set(CurrentFloor.scale, CurrentFloor.scale, CurrentFloor.scale);
    var BaseFloor = dataset[0];
    //Set the position
    var Altitude = parseInt(CurrentFloor.altitude);
    var b_offset_z = parseInt(CurrentFloor.building_offset_z);
    var Origin_X = parseInt(CurrentFloor.origin_x);
    var Origin_Y = parseInt(CurrentFloor.origin_y);
    var BaseOrigin_X = parseInt(BaseFloor.origin_x);
    var BaseOrigin_Y = parseInt(BaseFloor.origin_y);

    //Check if this is the base floor, so we don't move it too much
    if (FloorNumber == 0) {
        Origin_X = 0;
        Origin_Y = 0;
    }

    //Check to see if we are in the same building and if we are, figure which one is the base floor
    //then move the other floors relative to the base floor.
    FloorMesh.position.x = BaseOrigin_X + Origin_X;//CurrentFloor.building_offset_x + CurrentFloor.Origin_X;
    FloorMesh.position.z = BaseOrigin_Y + Origin_Y;
    FloorMesh.position.y = Altitude;// + b_offset_z;

    //Keep the plane flat on XZ axis!
    FloorMesh.rotation.x = Math.PI / 2;

    //Helps us locate the origin relative to the base.
    var origin = new THREE.AxisHelper(200);
    origin.position.x = BaseOrigin_X;
    origin.position.y = FloorMesh.position.y;
    origin.position.z = BaseOrigin_Y;


    var hex = 0xff0000;
    var CurrentFloorDimensions = [];
    // var fbox = new THREE.BoundingBoxHelper(Floor, hex);
    // fbox.update();
    //scene.add(fbox);

    FloorGeometry.computeBoundingBox();

    CurrentFloorDimensions["width"] = FloorGeometry.boundingBox.max.x - FloorGeometry.boundingBox.min.x;
    CurrentFloorDimensions["height"] = FloorGeometry.boundingBox.max.y - FloorGeometry.boundingBox.min.y;
    CurrentFloorDimensions["depth"] = FloorGeometry.boundingBox.max.z - FloorGeometry.boundingBox.min.z;
    CurrentFloorDimensions["min_x"] = FloorGeometry.boundingBox.min.x + Origin_X + BaseOrigin_X;
    CurrentFloorDimensions["max_x"] = FloorGeometry.boundingBox.max.x + Origin_X + BaseOrigin_X;
    CurrentFloorDimensions["min_y"] = FloorGeometry.boundingBox.min.y + Origin_Y + BaseOrigin_Y;
    CurrentFloorDimensions["max_y"] = FloorGeometry.boundingBox.max.y + Origin_Y + BaseOrigin_Y;
    FloorDimensions.push(CurrentFloorDimensions);

    //After drawing the floors, ask for how many circles to draw.
    var inputCircles = prompt("Floor # " + FloorNumber + ": How many circles? ");

    //Config.js function sends us circle data and we draw them depending on the boundaries of floor.
    EventPublisher(CurrentFloorDimensions["min_x"], CurrentFloorDimensions["max_x"],
        CurrentFloorDimensions["min_y"], CurrentFloorDimensions["max_y"],
        FloorMesh, CurrentFloor, inputCircles, scene);

    //Add custom lighting function later
    var light1 = new THREE.PointLight(0xffffff);
    light1.position.set(BaseOrigin_X + Origin_X, FloorMesh.position.y + 250, BaseOrigin_Y + Origin_Y);
    // console.log(light1.position);
    scene.add(light1);
    scene.add(origin);
    scene.add(FloorMesh);
}
//For each floor we want to draw, load the respective floor plan and create it.
function LoadFloors(data, FloorNumber) {
    var FloorDimensions = [];
    for (var i = 0; i < FloorNumber; i++) {
        CreateFloor(data, i, FloorDimensions);
        //console.log(FloorDimensions);
    }
}

function LoadData() {
    //Grab the data from the ajax call started in config.js
    LoadFloorPlan(dataset, function (result) {
        // console.log(result);
        var numFloors = result.length;
        var inputFloors = prompt("There are " + numFloors + " floor maps available, how many would you like to load?");
        if (inputFloors <= numFloors + 1) {
            alert("Loading...");
            LoadFloors(result, inputFloors);
        }
        Loading = false;
        que = new AnimationQueue();
        que.LoadQueue(Points);
        que.Animate();
        //console.log(que.Queue);
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
function GenerateRandomValue(min, max) {
    var random = Math.floor(Math.random() * (max - min) + min);// * FloorScale;
    return random;
}
//Instantiate tween for each point, allowing control of the sequences of animations
function CreateTween(Circle) {
    var anims = [];
    var circle = Circle;
    var time = new THREE.Clock();
    //Split up tweens into class functions.
    //TODO: Convert the tweens into class variables so we can call each animation on THIS
    var tweenOut = new TWEEN.Tween(circle.material)
        .to({
            opacity: 0.0,
            duration: 0.5,
            radius: 0,
            delay: 0
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
            x: GenerateRandomValue(-1500, 1500),
            z: GenerateRandomValue(-7000, 7000),
            duration: 0.5,
            delay: 3000
        });

    /* .onComplete(function() {

     tweenMove.delay(3000);
     tweenMove.repeat(Infinity);
     });*/
    var tweenMove = new TWEEN.Tween(circle.position)
        .to({
            x: GenerateRandomValue(-1500, 1500),
            z: GenerateRandomValue(-7000, 7000),
            duration: 0.5,
            delay: 3000
        })
        .onComplete(function () {
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
    this.Queue = [];
    this.Actives = [];
    this.LoadSize = 0;

    this.Enqueue = function (Object) {
        this.Queue.push(Object);
        this.Actives[this.Queue.indexOf(Object)] = false;
    };

    this.LoadQueue = function (Points) {
        if (!Loading) {
            //I'm just loading the array of all objects drawn for now.
            this.LoadSize = Points.length;
            for (var i = 0; i < this.LoadSize; i++) {
                this.Enqueue(Points[i]);
            }
        }
    };

    this.UpdateQueue = function () {
        return this.Queue;
    };

    this.Animate = function () {
        if (!Loading) {
            this.QueueSize = this.Queue.length;
            var FirstPriority = this.Queue[this.QueueSize];
            while (!this.Actives[FirstPriority] || this.QueueSize != 0) {
                this.QueueSize = this.Queue.length-1;
                this.popped = this.Queue.pop();
                CreateTween(this.popped);
                this.Actives[FirstPriority] = true;

            }
        }
    };
}

function animate() {
    requestAnimationFrame(animate);
    render();
    update();

}

function update() {
    controls.update();
    stats.update();
}

function render() {
    TWEEN.update();
    renderer.render(scene, camera);
}
