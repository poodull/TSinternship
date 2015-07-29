//////////
// MAIN //
//////////
var dataset = [];
// standard global variables
var container, scene, camera, renderer, controls, stats;
var mouse = new THREE.Vector2(), offset = new THREE.Vector3(),
    INTERSECTED;

var raycaster = new THREE.Raycaster();
var Points = [], Floors = [], Remove = false;
var Loading = true;
var AnimationQueue;
var SignalData;
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


    var CurrentFloorDimensions = [];

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
    Floors.push(FloorMesh);
    // console.log(FloorDimensions);

    /*  //After drawing the floors, ask for how many circles to draw.
     var inputCircles = prompt("Floor # " + FloorNumber + ": How many circles? ");

     //Config.js function sends us circle data and we draw them depending on the boundaries of floor.
     EventPublisher(CurrentFloorDimensions["min_x"], CurrentFloorDimensions["max_x"],
     CurrentFloorDimensions["min_y"], CurrentFloorDimensions["max_y"],
     FloorMesh, CurrentFloor, inputCircles, scene);*/
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
    var UpdateSignal = true;
    LoadCSV(dataset, function (result) {
        var FloorData = result[0];
        if (UpdateSignal) {
            SignalData = result[1];
        }
        console.log(SignalData);
        var numFloors = FloorData.length;
        // var inputFloors = prompt("There are " + numFloors + " floor maps available, how many would you like to load?");
        //console.log(numFloors);
        //  if (inputFloors <= numFloors) {
        alert("Loading...");

        LoadFloors(FloorData, 1);
        /*   }

         else {
         alert("INVALID NUMBER");
         LoadData();
         }*/

        AnimationQueue = new AnimationHandler();
        Loading = false;
        //Test data pump function goes here
        /* if (!Loading) {
         DataPump(SignalData);
         }*/
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

function AnimationHandler() {
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
    var FadeOut = function (Signal) {
        return new TWEEN.Tween(Signal.material)
            .to({
                opacity: 0.0,
                duration: 1.5,
                delay: 0
            })
            .easing(TWEEN.Easing.Exponential.In)
            .onComplete(function () {
                Signal.active = false;
                Floors[0].remove(Signal);
                Points.splice(Points.indexOf(Signal), 1);
            });
    };
    this.Move = function (Signal, pos_x, pos_y) {
        // var signal = Signal;
        return new TWEEN.Tween(Signal.position)
            .to({
                x: pos_x,
                y: pos_y,
                duration: 5,
                delay: 1000
            })
            .easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(function () {
                Signal.active = false;
                FadeOut(Signal).start();
            });
        //return tween_Move;
    };
    this.PopIn = function (Signal) {
        return new TWEEN.Tween(Signal.material)
            .to({
                opacity: 0.8,
                duration: 5,
                // DWELL PERIOD //
                delay: 3000
            })
            .easing(TWEEN.Easing.Exponential.In)
            .onComplete(function () {
                Signal.active = false;
                FadeOut(Signal).start();
            });
        //return tween_In;
    };

    //Probably need to split this function up into specific class functions for each tween.
    this.Animate = function () {
        //Check the Queue
        //See if item is active already
        //If active --> Update tween
        //If not --> create Tween
        //Remove from queue
        var test = true;
        this.timer = new THREE.Clock();
        if (!Loading && this.QueueSize != 0) {
            //this.Queue.reverse();
            TWEEN.removeAll();
            var FirstPriority = this.Queue[this.Queue.length - 1];
            // console.log(this.key);
            // console.log(this.Actives);
            while (this.QueueSize != 0) {
                this.QueueSize--;
                this.popped = this.Queue.pop();

                //console.log(this.popped);

                if (this.popped != null) {
                    this.key = this.popped.userData.id;
                    //console.log(this.key);//
                    this.Actives[this.key] = this.popped.userData.active;


                    //this.ObjectAnimations = this.popped.userData.animations;
                    if (!this.Actives[this.key]) {
                        this.ObjectAnimations = this.popped.userData.animations;
                        this.timer.start();
                        //Animation logic goes here//
                        this.ObjectAnimations["pop"] = this.PopIn(this.popped);
                        this.ObjectAnimations["pop"].start();
                        // this.ObjectAnimations["move"].delay(5000);

                        //this.ObjectAnimations["move"].start();

                        if (this.ObjectAnimations["move"] != null) {
                            this.ObjectAnimations["move"].delay(1000);
                            this.ObjectAnimations["move"].start();

                        }
                    }
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
            if (!Loading) {
                setInterval(function () {
                    DataPump(SignalData);
                }, 2100);

            }
            //Going to use setInterval until I can understand/figure out a better way to do this
            //Might need data first before I move on, so I can understand the larger scope of the issue

            //Instead of a data pump function, later use an UpdateQueue function that gets called every X seconds
            //and updates the positioning of the signals.

            break;

    }
}

function GenerateCircle(pos_x, pos_y, pos_z, radius, Floor, id, ColorScale) {
    //var colorScale = d3.scale.category10();
    /* var scale =  d3.scale.linear()
     .domain([0, 50, 100])
     .range(['green', 'yellow', 'red']);*/

    var geo_Circle = new THREE.CylinderGeometry(radius, radius, 2, 32);
    var mat_Circle = new THREE.MeshLambertMaterial({
        color: ColorScale(getRandomInt(0, 100)),//Math.random() * 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        frustumCulled: false,
        depthWrite: false,
        depthTest: false
    });

    var Circle = new THREE.Mesh(geo_Circle, mat_Circle);
    Circle.position.x = pos_x;
    Circle.position.y = pos_y; //+ geo_Cube.height;
    Circle.position.z = pos_z;//Math.random() * 800 - 400;
    Circle.rotation.x = Math.PI / 2;
    Circle.userData = {id: id, active: false, animations: [], lastUpdated: null, newPosition: false};
    Points.push(Circle);
    Floor.add(Circle);
    return Circle;
}
function ConvertSignalToCircle(SignalPoint, Floor) {
    var pos_x = parseInt(SignalPoint.Px);
    var pos_y = parseInt(SignalPoint.Py);
    var id = parseInt(SignalPoint.TxID);
    var height = parseInt(SignalPoint.Height);
    var ColorScale = d3.scale.linear().domain([0, 100]);
    ColorScale.domain([0, 0.5, 1].map(ColorScale.invert));
    ColorScale.range(["green", "yellow", "red"]);
    return GenerateCircle(pos_x, pos_y, height + 1, 5, Floor, id, ColorScale);
}
function DataPump(SignalData) {
    if (!Loading) {
        console.log("TEST");

        var QueueCount = 0;
        var Signal, SignalObject, id;
        // var percentLength = Math.floor(parseFloat(Points.length * 0.8));
        //console.log(percentLength);
        for (var S = 0; S < SignalData.length; S++) {
            //console.log(SignalData.length);
            Signal = SignalData[S];
            id = parseInt(Signal.TxID);
            SignalObject = Points[id];
            //Check if we've created an object for this specific signal.
            if (SignalObject == null) {
                //If we haven't, create it and push it to the queue. "Pop"
                Points[id] = ConvertSignalToCircle(Signal, Floors[0]);
                AnimationQueue.Enqueue(Points[id]);
                console.log(AnimationQueue);
            }

            else {
                //Tween Logic
                //Find differences and interpolate/change/color/update/etc
                var new_pos_x = Signal.Px, new_pos_y = Signal.Py;
                var last_pos_x = SignalObject.position.x, last_pos_y = SignalObject.position.y;

                if (new_pos_x != last_pos_x || new_pos_y != last_pos_y) {
                    Points[id].userData.newPosition = true;
                    //console.log("Last: (" + last_pos_y + "," + last_pos_y + ")");
                    //console.log("New: (" + new_pos_x + "," + new_pos_y + ")");
                    last_pos_x = new_pos_x;
                    last_pos_y = new_pos_y;

                    //console.log(Points[id]);
                    Points[id].userData.animations["move"] = (AnimationQueue.Move(Points[id], new_pos_x, new_pos_y));
                    AnimationQueue.Enqueue(Points[id]);

                    //  AnimationQueue.PopIn(Points[id]);
                    //Points[id].userData.animations["move"].start();
                    //AnimationQueue.Enqueue(SignalObject);

                    //Check when last updated. if recent update, dwell stage and move.

                    //else pop in and move
                }
                else {
                    Points[id].userData.newPosition = false;
                }
            }
        }
        if (AnimationQueue.Queue.length != 0) {
            AnimationQueue.Animate();
        }
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
