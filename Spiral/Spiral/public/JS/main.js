//////////
// MAIN //
//////////
var dataset = [];
// standard global variables
var container, scene, camera, renderer, controls, stats;
var mouse = new THREE.Vector2(), offset = new THREE.Vector3(),
    INTERSECTED;

var raycaster = new THREE.Raycaster();
var Points = [], Remove = false;
var Loading = true;
var que;

$(document).ready(function () {
    // initialization
    init();
    // animation loop
    animate();

});

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
    // so pull it back (z = 400) and up (y = 100) and set the angle towards the scene origin
    camera.position.set(0, 1500, 4000);
    camera.lookAt(scene.position);

    // create and start the renderer; choose antialias setting.
    if (Detector.webgl) {
        renderer = new THREE.WebGLRenderer({antialias: true});
    }
    else {
        renderer = new THREE.CanvasRenderer();
    }

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


    var ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    //Load Necessary Data through Config.js
    LoadData();
    // fog must be added to scene before first render
    // scene.fog = new THREE.FogExp2(0x9999ff, 0.00025);
    // without a Skybox or Fog effect of these, the scene's background color is determined by web page background
    // make sure the camera's "far" value is large enough so that it will render the skyBox!
    var skyBoxGeometry = new THREE.SphereGeometry(20000, 100, 100);//20000, 20000 );
    var skyBoxMaterial = new THREE.MeshBasicMaterial({color: 0x9999ff, side: THREE.BackSide});
    var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
    scene.add(skyBox);

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('touchstart', onDocumentTouchStart, false);
    document.addEventListener('keydown', OnKeyDown, false);
    window.addEventListener('resize', onWindowResize, false);

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
    CurrentFloorDimensions["min_x"] = FloorGeometry.boundingBox.min.x;// + Origin_X + BaseOrigin_X;
    CurrentFloorDimensions["max_x"] = FloorGeometry.boundingBox.max.x;// + Origin_X + BaseOrigin_X;
    CurrentFloorDimensions["min_y"] = FloorGeometry.boundingBox.min.y;// + Origin_Y + BaseOrigin_Y;
    CurrentFloorDimensions["max_y"] = FloorGeometry.boundingBox.max.y;//+ Origin_Y + BaseOrigin_Y;
    CurrentFloorDimensions["min_z"] = FloorGeometry.boundingBox.min.z;// + Origin_Y + BaseOrigin_Y;
    CurrentFloorDimensions["max_z"] = FloorGeometry.boundingBox.max.z;//+ Origin_Y + BaseOrigin_Y;

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
    scene.add(light1);
    //console.log(light1.position);
    scene.add(origin);
    scene.add(FloorMesh);
}
//For each floor we want to draw, load the respective floor plan and create it.
function LoadFloors(data, FloorNumber) {
    var FloorDimensions = [];
    for (var i = 0; i < FloorNumber; i++) {
        CreateFloor(data, i, FloorDimensions);
    }
}

function LoadData() {
    //Grab the data from the ajax call started in config.js
    LoadFloorPlan(dataset, function (result) {
        // console.log(result);
        var numFloors = result.length;
        var inputFloors = prompt("There are " + numFloors + " floor maps available, how many would you like to load?");
        //console.log(numFloors);
        if (inputFloors <= numFloors) {
            alert("Loading...");
            LoadFloors(result, inputFloors);
        }
        else {
            alert("INVALID NUMBER");
            LoadData();
        }
        Loading = false;
        que = new AnimationQueue();
        //Test data pump function goes here
    });
}

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
/*function CreateTween(Circle) {
 var anims = [];
 var circle = Circle;
 var time = new THREE.Clock();
 //Split up tweens into class functions.
 //TODO: Convert the tweens into class variables so we can call each animation on THIS
 var tweenOut = new TWEEN.Tween(circle.material)
 .to({
 opacity: 0.0,
 duration: 0.5,
 delay: 0
 })
 .easing(TWEEN.Easing.Linear.None)
 .onComplete(function () {
 tweenIn.start();
 // if (circle.material.opacity == 0) {
 //make a garbage collection function that adds these to an array and then delete them
 // using //    THREE.SceneUtils.detach(circle, Floor, scene);

 //  tweenIn.stop();
 //.remove(circle);
 //      }
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

 // DWELL PERIOD //
 tweenOut.start();
 });

 var tweenMove = new TWEEN.Tween(circle.position)
 .to({
 x: GenerateRandomValue(-400, 400),
 y: GenerateRandomValue(-900, 900),

 //  z: GenerateRandomValue(-7000, 7000),
 duration: 0.5,
 delay: 3000
 })
 .easing(TWEEN.Easing.Quadratic.Out);
 tweenIn.chain(tweenSizeIn);

 anims.push(tweenIn);
 anims.push(tweenMove);
 // console.log(anims);
 tweenIn.chain(tweenMove);
 tweenIn.start();
 }*/
function CreateTween(Circle, Flag) {
    var anims = [];
    var circle = Circle;
    circle.userData.active = true;
    var time = new THREE.Clock();
    //Split up tweens into class functions.
    //TODO: Convert the tweens into class variables so we can call each animation on THIS
    var tweenOut = new TWEEN.Tween(circle.material)
        .to({
            opacity: 0.0,
            duration: 0.5,
            delay: 0
        })
        .easing(TWEEN.Easing.Linear.None)
        .onComplete(function () {
            //  tweenIn.start();
            circle.userData.active = false;
        });
    var tweenSizeIn = new TWEEN.Tween(circle.scale)
        .to({
            x: 1,
            y: 1,
            z: 1
        }, 3000).easing(TWEEN.Easing.Bounce.Out);
    var tweenIn = new TWEEN.Tween(circle.material)
        .to({
            opacity: 0.8,
            duration: 5,
            // DWELL PERIOD //
            delay: 3000
        })

        .easing(TWEEN.Easing.Exponential.In)
        .onComplete(function () {

            tweenOut.start();
        });

    var tweenMove = new TWEEN.Tween(circle.position)
        .to({
            x: GenerateRandomValue(-400, 400),
            y: GenerateRandomValue(-900, 900),

            duration: 0.5,
            delay: 3000
        })
        .easing(TWEEN.Easing.Quadratic.Out);

    tweenIn.chain(tweenSizeIn);
    //tweenIn.start();
    anims.push(tweenIn);
    anims.push(tweenMove);
}
function AnimationQueue() {
    this.Queue = [];
    this.Actives = [];
    this.TweenTypes = ['default', 'pop', 'fade', 'move'];
    this.QueueSize = this.Queue.length;
    this.Enqueue = function (Object) {
        this.Queue.push(Object);
        this.QueueSize++;
        //console.log(Object.userData.id);
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
    this.CreateTween = function (Circle) {
        //Create Animation sequence for circle in queue
        var Animations = [];
        var circle = Circle;
        //Set the circles active flag to true
        circle.userData.active = true;
        var time = new THREE.Clock();
        time.start();
        var r_size = GenerateRandomValue(1, 4);
        //Split up tweens into class functions.
        //TODO: Convert the tweens into class variables so we can call each animation on THIS
        var tweenOut = new TWEEN.Tween(circle.material)
            .to({
                opacity: 0.0,
                duration: 0.5,
                delay: 0
            })
            .easing(TWEEN.Easing.Linear.None)
            .onComplete(function () {
                //  Put object in a deletion array and remove it after each animate looooop.
                circle.userData.active = false;
                tweenOut.stop();
            });
        var tweenSizeIn = new TWEEN.Tween(circle.scale)
            .to({
                x: r_size,
                y: r_size,
                z: r_size
            }, 3000)
            .easing(TWEEN.Easing.Bounce.Out);
        var tweenSizeOut = new TWEEN.Tween(circle.scale)
            .to({
                x: 1,
                y: 1,
                z: 1
            }, 3000)
            .easing(TWEEN.Easing.Bounce.Out);
        var tweenIn = new TWEEN.Tween(circle.material)
            .to({
                opacity: 0.8,
                duration: 5,
                // DWELL PERIOD //
                delay: 3000
            })
            .easing(TWEEN.Easing.Exponential.In);


        var tweenMove = new TWEEN.Tween(circle.position)
            .to({
                x: GenerateRandomValue(-400, 400),
                y: GenerateRandomValue(-900, 900),

                duration: 0.5,
                delay: 3000
            })
            .easing(TWEEN.Easing.Quadratic.Out);

        tweenIn.chain(tweenSizeIn);
        tweenOut.chain(tweenSizeOut);
        Animations["pop"] = tweenIn;
        Animations["fade"] = tweenOut;
        Animations["move"] = tweenMove;
        // Circle.userData.animations = anims;
        //tweenIn.start();
        return Animations;

    };
    this.Animate = function () {
        //Check the Queue
        //See if item is active already
        //If active --> Update tween
        //If not --> create Tween
        //Remove from queue
        this.timer = new THREE.Clock();
        if (!Loading && this.QueueSize != 0) {
            TWEEN.removeAll();
            var FirstPriority = this.Queue[this.Queue.length - 1];
            // console.log(this.key);
            // console.log(this.Actives);
            while (this.QueueSize != 0) {
                this.QueueSize--;
                this.popped = this.Queue.pop();
                if (this.popped != null && !this.active) {
                    this.key = this.popped.userData.id;
                    this.Actives[this.key] = (this.popped.userData.active);

                    this.ObjectAnimations = this.popped.userData.animations;
                    this.ObjectAnimations = this.CreateTween(this.popped);
                    this.timer.start();
                    this.ObjectAnimations["pop"].start();
                    this.ObjectAnimations["fade"].delay(2000);
                    this.timer.getElapsedTime();
                    this.ObjectAnimations["fade"].start();

                    // this.test = this.ObjectAnimations["pop"].chain(this.ObjectAnimations["fade"]);
                    //   this.test.start();
                    console.log(this.Actives.length);
                    //this.popped.userData.animations["pop"].start();
                }

            }
        }
    };
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
            break;
        case 35:
            //
            // RemovePoints(); //Remove point when clicked!
            break;
        case 76: //'l'
            event.preventDefault();
            //Going to use setInterval until I can understand/figure out a better way to do this
            //Might need data first before I move on, so I can understand the larger scope of the issue

            //Instead of a data pump function, later use an UpdateQueue function that gets called every X seconds
            //and updates the positioning of the signals.
            setInterval(function () {
                DataPump();
            }, 4000);
            //    DataPump();
            break;

    }
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
