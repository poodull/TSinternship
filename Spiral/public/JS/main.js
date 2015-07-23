//////////
// MAIN //
//////////
var dataset = [];
// standard global variables
var container, scene, camera, renderer, controls, stats;
var clock = new THREE.Clock();
var mouse = new THREE.Vector2(), offset = new THREE.Vector3(),
    INTERSECTED, SELECTED;
;
var raycaster = new THREE.Raycaster();
var Points = [], Remove = false;
var Removed = [];
var Pumping = false;
var Loading = true;
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (/* function */ callback, /* DOMElement */ element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
// initialization
init();
// animation loop
//animate();
animate();

//necessary functions
function init() {
    //Create the scene
    scene = new THREE.Scene();

    // set the view size in pixels (custom or according to window size)
    // var SCREEN_WIDTH = 400, SCREEN_HEIGHT = 300;
    var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
    // camera attributes
    var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 80000;
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


    // var ambientLight = new THREE.AmbientLight(0x111111);
    // scene.add(ambientLight);
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
    onDocumentMouseDown(eventl);
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
            AnimationHandler();
            break;

    }
}

function ImportFloorImage(floor_data, floor_id) {
    return floor_data[floor_id].image;
}

function CreateFloor(dataset, FloorNumber) {


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
        //   depthTest:false
    });
    var ImageHeight = 1985, ImageWidth = 995;
    var floorGeometry = new THREE.PlaneBufferGeometry(ImageWidth, ImageHeight, 1, 1);
    var Floor = new THREE.Mesh(floorGeometry, floorMaterial);
    DrawPoints(Floor, dataset);
    var baseFloor = dataset[0];
    //console.log(baseFloor);
    Floor.scale.set(CurrentFloor.scale, CurrentFloor.scale, CurrentFloor.scale);
    //Set the position
    var altitude = parseInt(CurrentFloor.altitude);
    var b_offset_z = parseInt(CurrentFloor.building_offset_z);
    var origin_x = parseInt(CurrentFloor.origin_x);
    var origin_y = parseInt(CurrentFloor.origin_y);
    var base_origin_x = parseInt(baseFloor.origin_x);
    var base_origin_y = parseInt(baseFloor.origin_y);
    //console.log("The Base Origin: " + base_origin_x +"," + base_origin_y);
    //console.log("The Current Floor Origin: " + origin_x + "," + origin_y);
    //Check if this is the base floor, so we don't move it too much
    //should add a check to see if we are in the same building and if we are, figure which one is the base floor
    //then move the other floors relative to the base floor.
    if (FloorNumber == 0) {
        origin_x = 0;
        origin_y = 0;
    }
    Floor.position.x = base_origin_x + origin_x;//CurrentFloor.building_offset_x + CurrentFloor.origin_x;
    Floor.position.z = base_origin_y + origin_y;
    Floor.position.y = altitude;// + b_offset_z;
    //Keep the plane flat against the camera!
    Floor.rotation.x = Math.PI / 2;

    var origin = new THREE.AxisHelper(200);
    origin.position.x = base_origin_x;
    origin.position.y = Floor.position.y;
    origin.position.z = base_origin_y;

    var hex = 0xff0000;
    var CurrentFloorDimensions = [];
    var fbox = new THREE.BoundingBoxHelper(Floor, hex);
    Floor.geometry.computeBoundingBox();
    var FloorGeometry = Floor.geometry;
    //var width =
    // var height = FloorGeometry.boundingBox.max.y - FloorGeometry.boundingBox.min.y;
    //   var depth = FloorGeometry.boundingBox.max.z - FloorGeometry.boundingBox.min.z;
    // var min_x,max_x,min_y,max_y,min_z,max_z;
    CurrentFloorDimensions["width"] = FloorGeometry.boundingBox.max.x - FloorGeometry.boundingBox.min.x;
    CurrentFloorDimensions["height"] = FloorGeometry.boundingBox.max.y - FloorGeometry.boundingBox.min.y;
    CurrentFloorDimensions["depth"] = FloorGeometry.boundingBox.max.z - FloorGeometry.boundingBox.min.z;
    CurrentFloorDimensions["min_x"] = FloorGeometry.boundingBox.min.x + origin_x + base_origin_x;
    CurrentFloorDimensions["max_x"] = FloorGeometry.boundingBox.max.x + origin_x + base_origin_x;
    CurrentFloorDimensions["min_y"] = FloorGeometry.boundingBox.min.y + origin_y + base_origin_y;
    CurrentFloorDimensions["max_y"] = FloorGeometry.boundingBox.max.y + origin_y + base_origin_y;
    // CurrentFloorDimensions["min_z"] = FloorGeometry.boundingBox.min.z;
    //CurrentFloorDimensions["max_z"] = FloorGeometry.boundingBox.max.z;
    // console.log("Floor Number:" + FloorNumber);
    // console.log(Floor.position);


    // AllFloorDimensions[FloorNumber] = (CurrentFloorDimensions);
    // console.log(AllFloorDimensions);
    // console.log(FloorDimensions["max_x"]);
    // console.log(FloorDimensions["min_x"]);
    //console.log(typeof  parseInt(dataset[FloorNumber].origin_x));
    //console.log("The center of the bounding box is at: " + fbox.geometry.center);
    //console.log(width + "," + height + "," + depth);
    // console.log("The range is:");
    // console.log(CurrentFloorDimensions);
    var min_x = Floor.position.x + FloorGeometry.boundingBox.min.x;
    var max_x = Floor.position.x + FloorGeometry.boundingBox.max.x;
    var min_y = Floor.position.x + FloorGeometry.boundingBox.min.y;
    var max_y = Floor.position.x + FloorGeometry.boundingBox.max.y;
    // console.log(worldtoLocal(Floor.position));
    //console.log("world: " + Floor.position.x + "," + Floor.position.y + "," + Floor.position.z );
    //var vector = new THREE.Vector3().copy( Floor.position);
    //console.log( Floor.worldToLocal( vector ) );
    // console.log("local: " + vector.x + "," + vector.y + "," + vector.z);
    // console.log("X: (" + relative_min_x + "," + relative_max_x + ")");
    //  console.log("Y: (" + relative_min_y + "," + relative_max_y + ")");
    // console.log("Z: (" + f_geo.boundingBox.min.z + "," + f_geo.boundingBox.max.z + ")");

    EventPublisher(min_x, max_x, min_y, max_y, Floor);
   // fbox.update();
    //scene.add(fbox);
    var light1 = new THREE.PointLight(0xffffff);
    light1.position.set(base_origin_x + origin_x, Floor.position.y + 250, base_origin_y + origin_y);
    scene.add(light1);
    scene.add(origin);
    scene.add(Floor);
}

function LoadFloors(data, FloorNumber) {
    for (var i = 0; i < FloorNumber; i++) {
        CreateFloor(data, i);
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
//turn this into a class
function EventPublisher(min_x, max_x, min_y, max_y, Floor) {
    var RandomCubes = true;
    if (RandomCubes) {
        var randomX;
        var randomY;
        for (var i = 0; i < 2; i++) {
            randomX = Math.floor(Math.random() * (max_x - min_x) + min_x);
            randomY = Math.floor(Math.random() * (max_y - min_y) + min_y);
            scene.add(GenerateCircle(randomX, Floor.position.y + 3, randomY));
        }
    }
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


            INTERSECTED = intersects[0].object;
            material = INTERSECTED.material;
            console.log(INTERSECTED);
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
function tweenAlphaOut(mesh) {
    TWEEN.removeAll();
    new TWEEN.Tween(mesh.material).to({
        opacity: 0
    }, 3000).easing(TWEEN.Easing.Elastic.Out).start();
    /*new TWEEN.Tween( IntersectedPoint.scale ).to( {
     x:1,
     y:1,
     z:1
     }, 3000 ).easing( TWEEN.Easing.Elastic.Out).start();*/
}

function tweenAlphaIn(mesh) {
    new TWEEN.Tween(mesh.scale).to({
        x: 2,
        y: 2,
        z: 2
    }, 3000).easing(TWEEN.Easing.Elastic.Out).start();
}
//Add a single point to the plane.
//TODO: Take input or load new json file with data and render
//Need cube data input
function GenerateCube(cubeNum) {
    var CubeW = 20, CubeH = 20, CubeL = 20;
    var geo_Cube = new THREE.BoxGeometry(CubeW, CubeH, CubeL);
    var mat_Cube = new THREE.MeshLambertMaterial({
        color: Math.random() * 0xffffff,
        transparent: true,
        opacity: 0.8
    });

    var mesh_NewPoint = new THREE.Mesh(geo_Cube, mat_Cube);

    mesh_NewPoint.position.x = Math.random() * 800 - 400;
    mesh_NewPoint.position.y = 1000 + CubeH; //+ geo_Cube.height;
    mesh_NewPoint.position.z = 10 * cubeNum;//Math.random() * 800 - 400;

    return mesh_NewPoint;
}
function GenerateCircle(pos_x, pos_y, pos_z) {
    // var CubeW = 20, CubeH = 20, CubeL = 20;
    var geo_Circle = new THREE.CircleGeometry(100, 32);
    var mat_Circle = new THREE.MeshLambertMaterial({
        color: Math.random() * 0xffffff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
        //blending: THREE.AdditiveBlending
    });

    var Circle = new THREE.Mesh(geo_Circle, mat_Circle);

    Circle.position.x = pos_x;
    Circle.position.y = pos_y + 1; //+ geo_Cube.height;
    Circle.position.z = pos_z;//Math.random() * 800 - 400;
    Circle.rotation.x = Math.PI / 2;
    // Circle.rotation.x = Math.PI / 2;
    // Circle.rotation.x = Math.PI / 2;

    // console.log(cubeNum);
    //  console.log("X: " + Cube.position.x);
    //  console.log("Y: " + Cube.position.y);
    //  console.log("Z: " + Cube.position.z);
    Points.push(Circle);
    return Circle;
}

function AddPoint(cubeNum, floor) {

    var mesh_Cube = GenerateCube(cubeNum);
    scene.add(mesh_Cube);
    tweenAlphaIn(mesh_Cube);
    Points.push(mesh_Cube);
//   CubeIndices.push(dataset[cubeNum].id);
    //  CubeTLW.push(dataset
}
function DrawPoints(plane, floor_data) {
    // most objects displayed are a "mesh":
    //  a collection of points ("geometry") and
    //  a set of surface parameters ("material")
    var numPoints = 0;
    var mesh_Box;
    for (var i = 0; i < numPoints; i++) {
        AddPoint(i, plane);
    }
    //Floor 2
    var f_scale = floor_data[1].scale;
    //console.log(f_scale);
    var cubeW = 1 * f_scale, cubeH = 1 * f_scale, cubeL = 1 * f_scale;


    //2nd floor scale
    //c1.geometry.scale.multiplyScalar(f_scale,f_scale,f_scale);
    //c1.geometry.applyMatrix( new THREE.Matrix4().makeBasis( floor_data[1].origin_x,1000, floor_data[1].origin_y ) );

    //  c1.geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0,0, 0 ) );
    // c2.geometry.applyMatrix( new THREE.Matrix4().makeTranslation( floor_data[2].origin_x,0, floor_data[2].origin_y ) );
    //var basis2 = new THREE.Matrix4().makeBasis( floor_data[1].origin_x,1000, floor_data[1].origin_y );
    //  var basis3 = new THREE.Matrix4().makeBasis( floor_data[2].origin_x,0, floor_data[2].origin_y );

    // c2.geometry.applyMatrix(basis2);
    //c2.geometry.applyMatrix(basis2);

    // c3.geometry.applyMatrix(basis3);
    // console.log(floor_data[1].origin_x);
}
//Remove selected point on click
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
function FakeData() {

}
function AnimationHandler() {
    this.queue = [];
    this.active = false;
    this.timer = null;
    this.createTween = function ( object,startTime,endTime ) {
        // return array of tween coordinate data (start->end)
        type = type || 'default';
        var tween = [start];
        var tmp = start;
        var diff = end - start;
    };
    if (!Loading) {
        this.timer = Date.now();
        var circle = Points[0];
        var anims = [];
        var tweenOut = new TWEEN.Tween(circle.material)
            .to({
                opacity: 0.0,
                duration: 3,
                radius: 0,
                delay: 1500
            })
            .easing(TWEEN.Easing.Linear.None)
            .onComplete(function()
        {
            tweenIn.start();

            //tweenOut.stop();
            console.log("tween out complete: ");
        });
        var tweenAlphaSizeIn = new TWEEN.Tween(circle.scale)
            .to({
                x: 2,
                y: 2,
                z: 2
            },500).easing(TWEEN.Easing.Bounce.Out);
        var tweenAlphaSizeOut = new TWEEN.Tween(circle.scale)
            .to({
                x: 0,
                y: 0,
                z: 0
            }, 1500)
            .easing(TWEEN.Easing.Bounce.Out);


        var tweenIn = new TWEEN.Tween(circle.material)
            .to({
                opacity: 0.8,
                duration: 0.5,
                delay: 3000
            })

            .easing(TWEEN.Easing.Exponential.In)
            .onComplete(function () {
                console.log("tween in complete: " );
                tweenOut.delay(3000);
               // tweenIn.stop();
                tweenOut.start();
                // setTimeout(tweenOut.start(),3000);
            });
        tweenIn.chain(tweenAlphaSizeIn);
        anims["start"] = tweenIn;
        tweenOut.chain(tweenAlphaSizeOut);
        anims["end"] = tweenOut;

        if (!this.active) {
            anims["start"].start();
            //    setTimeout(anims["end"].start(),1000);
            this.active = true;
        }
    }
}

function updateData() {

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
    renderer.render(scene, camera);
}
