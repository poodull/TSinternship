/**
 * Created by Tommy Fang on 7/31/2015.
 */
var _container, _scene, _camera, _renderer,
    _controls, _stats, _Animator, _floorData, _crossFilter, _rawSignalData;
var _floorDimensions = [];
var _originAxis;
/*
 _container: refers to the div element that holds all of the rendering we will do
 _scene: the background /3D plane, it holds the three.js objects that we add.
 _camera: A perspective camera that allows us to freely view the scene.
 _renderer: A detector class is used to see if the user’s browser has webGL enabled, otherwise this becomes a THREE.CanvasRenderer.
 _controls: THREE.OrbitControls are provided by the Three.js team. It allows to move around scene using the mouse.
 _stats: used for development purposes, shows framerate and lag time.
 _Animator: instance of AnimationHandler, see animations.js.
 FloorData: holds the array of CSV objects representing each line of floor data.
 _crossFilter: instance of chart class, used to filter signal data. see _charts.js
 _rawSignalData; holds csv signal data that gets parsed by d3 server side.
 _originAxis: new calculated origin based on floor origin
 */

function init() {
    //Create the _scene
    _scene = new THREE.Scene();
    _Animator = new AnimationHandler();

    // set the view size in pixels (custom or according to window size)
    // var SCREEN_WIDTH = 400, SCREEN_HEIGHT = 300;
    var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
    // _camera attributes
    var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 100, FAR = 80000;
    // set up _camera
    _camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    //A perspective _camera that allows us to freely view the _scene.
    // add the _camera to the _scene
    _scene.add(_camera);
    // the _camera defaults to position (0,0,0)
    // so pull it back (z = 1500) and up (y = 4000) and set the angle towards the _scene origin
    _camera.position.set(0, 800, 1000);
    _camera.lookAt(_scene.position);

    // create and start the _renderer; choose antialias setting.
    if (Detector.webgl) {
        _renderer = new THREE.WebGLRenderer({antialias: true});
    } else {
        _renderer = new THREE.CanvasRenderer();
    }
    //Adjust the _renderer view size
    _renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

    // attach div element to variable to contain the _renderer
    _container = document.getElementById('ThreeJS');

    // alternatively: to create the div at runtime, use:
    //   _container = document.createElement( 'div' );
    //    document.body.appendChild( _container );
    // attach _renderer to the _container div
    _container.appendChild(_renderer.domElement);


    // move _mouse and: left   click to rotate,
    //                 middle click to zoom,
    //                 right  click to pan
    _controls = new THREE.OrbitControls(_camera, _renderer.domElement);

    // displays current and past frames per second attained by _scene
    _stats = new Stats();
    _stats.domElement.style.position = 'absolute';
    _stats.domElement.style.bottom = '0px';
    _stats.domElement.style.zIndex = 100;
    _container.appendChild(_stats.domElement);

    //Covers the entire _scene and all objects in a yellowish light
    var ambientLight = new THREE.AmbientLight(0xffff00);
    _scene.add(ambientLight);

    //obtain necessary Data through data.js
    LoadData();
    //Paints the background black
    // fog must be added to _scene before first render
    _scene.fog = new THREE.FogExp2(0x9999ff, 0);
    // without a Skybox or Fog effect of these, the _scene's background color is determined by web page background
    // make sure the _camera's "far" value is large enough so that it will render the skyBox!
    /* var skyBoxGeometry = new THREE.SphereGeometry(20000, 100, 100);//20000, 20000 );
     var skyBoxMaterial = new THREE.MeshBasicMaterial({color: 0x9999ff, side: THREE.BackSide});
     var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
     _scene.add(skyBox);*/

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('touchstart', onDocumentTouchStart, false);
    document.addEventListener('keydown', OnKeyDown, false);
    window.addEventListener('resize', onWindowResize, false);

}

function CreateFloor(dataset, floorNumber) {
    //Create each floor depending on user request.
    var currentFloor = dataset[floorNumber],
        image = dataset[floorNumber].image,
    //Deserialize the floor image, which is originally converted into a base64 byte array
        floorPlan = "data:image/png;base64," + image, //'Assets/Images/NewOfficeTS.png';
    //Load the floorplan as a texture.
        floorTexture = new THREE.ImageUtils.loadTexture(floorPlan);
    floorTexture.minFilter = THREE.LinearFilter;
    //Set up the properties of the floor plan.
    var floorMaterial = new THREE.MeshBasicMaterial({
            map: floorTexture,
            side: THREE.DoubleSide,
            //Prevents clipping when viewing from underneath.
            transparent: true,
            depthWrite: false,
            //Prevents choppy rendering with other objects at the same z-index.
            frustumCulled: false
        }),
    //Hardcoded image width/height, it should probably be included in the CSV
    //There is not a built-in method to obtain the parameters of this image.
        imageHeight = parseInt(currentFloor.image_height), imageWidth = parseInt(currentFloor.image_width),
    //x:242, y: 121
    //Create the geometry of the floor/mesh and adjust using the floor properties given in the CSV file.
        floorGeometry = new THREE.PlaneBufferGeometry(imageHeight, imageWidth, 1, 1),
        floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    // FloorMesh._scale.set(CurrentFloor._scale, CurrentFloor._scale, CurrentFloor._scale);
    _scale = currentFloor.scale;
    //Set the floor that acts as a basis for all floors.
    var BaseFloor = dataset[0],
    //Set the position
        altitude = parseInt(currentFloor.altitude),
        b_offset_z = parseInt(currentFloor.building_offset_z),
    //Calculate a common origin between all the floors in the same building.
    //Will need to make this more dynamic later, if we are planning to incorporate multiple buildings in the same floor.
        originX = parseInt(currentFloor.origin_x),
        originY = parseInt(currentFloor.origin_y);
        //BaseOrigin_X = parseInt(BaseFloor.origin_x),
      //  BaseOrigin_Y = parseInt(BaseFloor.origin_y);

    //Check if this is the base floor, so we don't move it too much
    //Check to see if we are in the same building and if we are, figure which one is the base floor
    //then move the other floors relative to the base floor.
    /*    FloorMesh.position.x = BaseOrigin_X + Origin_X + ImageWidth/2;//CurrentFloor.building_offset_x + CurrentFloor.Origin_X;
     FloorMesh.position.z = BaseOrigin_Y + Origin_Y - ImageHeight/2;
     FloorMesh.position.y = Altitude;// + b_offset_z;*/
    //Keep the plane flat on XZ axis!
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.rotation.z = Math.PI / 2;

    //Helps us locate the origin relative to the base.
    _originAxis = new THREE.AxisHelper(200);
    floorMesh.position.x = 0;//BaseOrigin_X + Origin_X + ImageWidth/2;//CurrentFloor.building_offset_x + CurrentFloor.Origin_X;
    floorMesh.position.z = 0;
    floorMesh.position.y = altitude;// + b_offset_z;
    // console.log(FloorMesh.position);
    //harded coded in to help me figure out where the points are on the map.
    var halfX = imageWidth / 2, halfY = imageHeight / 2;
    _originAxis.position.x = -halfX + originX;
    _originAxis.position.y = floorMesh.position.y;
    _originAxis.position.z = -halfY + (imageHeight - originY);
    _originAxis.rotation.x = -Math.PI / 2;
    // console.log(ImageHeight + " , " + ImageWidth);
    // console.log(_originAxis.position);
    var currentFloorDimensions = [];

    floorGeometry.computeBoundingBox();
    //We will need this floor data later when we confine the position of signals to the bounding box of the floor.
    currentFloorDimensions["width"] = floorGeometry.boundingBox.max.x - floorGeometry.boundingBox.min.x;
    currentFloorDimensions["height"] = floorGeometry.boundingBox.max.y - floorGeometry.boundingBox.min.y;
    currentFloorDimensions["depth"] = floorGeometry.boundingBox.max.z - floorGeometry.boundingBox.min.z;
    currentFloorDimensions["min_x"] = (floorGeometry.boundingBox.min.x) * currentFloor.scale;// + Origin_X + BaseOrigin_X;
    currentFloorDimensions["max_x"] = (floorGeometry.boundingBox.max.x) * currentFloor.scale;// + Origin_X + BaseOrigin_X;
    currentFloorDimensions["min_y"] = (floorGeometry.boundingBox.min.y) * currentFloor.scale;// + Origin_Y + BaseOrigin_Y;
    currentFloorDimensions["max_y"] = (floorGeometry.boundingBox.max.y) * currentFloor.scale;//+ Origin_Y + BaseOrigin_Y;
    currentFloorDimensions["min_z"] = floorGeometry.boundingBox.min.z;// + Origin_Y + BaseOrigin_Y;
    currentFloorDimensions["max_z"] = floorGeometry.boundingBox.max.z;//+ Origin_Y + BaseOrigin_Y;
    currentFloorDimensions["_scale"] = currentFloor.scale;
    currentFloorDimensions["origin_x"] = originX;
    currentFloorDimensions["origin_y"] = originY;
    _floorDimensions.push(currentFloorDimensions);
    _floors.push(floorMesh);
    /*  //After drawing the floors, ask for how many circles to draw.
     var inputCircles = prompt("Floor # " + FloorNumber + ": How many circles? ");
     //Config.js function sends us circle data and we draw them depending on the boundaries of floor.
     CurrentFloorDimensions["min_y"], CurrentFloorDimensions["max_y"],
     FloorMesh, CurrentFloor, inputCircles, _scene);*/
    //Add custom lighting function later
    //A point light(hex color, intensity, distance) can be placed
    //using light.position.set(x,y,z);
    //It acts as a light bulb, shining in all directions at the position.
    var light = new THREE.PointLight(0xffff00, 1, 0);
    light.position.set( originX, floorMesh.position.y + 250,  originY);
    _scene.add(light);
    _scene.add(_originAxis);
    _scene.add(floorMesh);
}

function LoadFloors(data, floorNumber) {
    for (var i = 0; i < floorNumber; i++) {
        CreateFloor(data, i);
    }
}

function LoadData() {
    //Grab the data from the ajax call started in the router index.js
    LoadCSV(_dataSet, function (result) {
        _floorData = result[0];
        _rawSignalData = result[1];
        if (_loading) {
            LoadFloors(_floorData, 1);
            //Draw the floors based on number requested.
            _crossFilter = new FilterCharts(result[1]);
            //Create an instance of the _charts class, allowing us to access the filters/_charts and render them.
        }
        _loading = false;
    });
}
//Create the circle

function GenerateCircle(lat, long, alt, radius, id, frequency, bandwidth, tlw) {
    //Set up a cylinder geometry using above args:
    //create color based on currently toggled variable
    var signalColor, selectedLength = Object.keys(_selectedArr).length;
    frequency = (frequency / 100000).toFixed(1);
    if (_tlwToggle) {
        //Creates a color based on TLW 0-10
        signalColor = _tlwScale(tlw)
    }
    if (_freqToggle) {
        signalColor = _freqScale(frequency);
    }
    if (_bwToggle) {
        signalColor = _bwScale(bandwidth);
    }

    var circleGeometry = new THREE.CylinderGeometry(radius, radius, 1, 32);
    var circleMaterial = new THREE.MeshLambertMaterial({
        color: signalColor, //Set this color using a d3 _scale depending on arg
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        frustumCulled: false,
        depthWrite: false, //Prevents z-fighting
        shading: THREE.SmoothShading
    });
    //Combine the mesh and material
    var circle = new THREE.Mesh(circleGeometry, circleMaterial);
   // console.log(Object.keys(_selectedArr).length);

    if (selectedLength > 0) {
        circle.material.color.setHex("#669999");
    }
    //Set the position based on input
    //origin_x,origin_y should be calculated based on three.js _scene positioning.
    //see documentation for more details on how the _scene is set up.
    var origin_x = _floorDimensions[0]["origin_x"];
    var origin_y = _floorDimensions[0]["origin_y"];

    circle.position.x = lat;
    circle.position.y = alt;
    circle.position.z = long;

    //Builtin vars to help with tweening.
    //ID: TxID, active: if we are in a tween state, animations: current animation
    //_filteredSelection is used by _charts.js/controller.js whenever a signal is clicked.
    //When a signal is clicked on the signal list or map, the flag gets set to true and the object gets placed
    //into the _selectedSignals array.
    //Upon completion of fade out, the pointer to the object, in aforementioned array, gets deleted.
    circle.userData = {
        id: id, animations: [], selected: false,
        freq: frequency, bw: bandwidth, TLW: tlw
        //freq,bw,tlw used by _charts.css and signal generator to determine color.
    };
    //Draw the circle to the _scene.
    _scene.add(circle);
    return circle;
}
//Parse the signal data
function ConvertSignalToCircle(signalPoint) {
    var lat = parseInt(signalPoint.X),
        long = parseInt(signalPoint.Y) * -1, //Y is Z longitude
        alt = parseInt(signalPoint.Z),//Z is altitude(Y in three.js)
        id = parseInt(signalPoint.TXID),

        frequency = parseInt(signalPoint.FREQ),
        bandwidth = parseInt(signalPoint.BW),
        tlw = parseInt(signalPoint.TLW),
    //scales use d3 to calculate the min and max found in the csv and outputs value for the variable.
        radius = _sizeScale(signalPoint.AMP);
    lat = _originAxis.position.x + (lat * _scale);
    long = _originAxis.position.z + (long * _scale);

    //Generate circle using signal data.
    return GenerateCircle(lat, long, alt, radius, id, frequency, bandwidth, tlw);
}