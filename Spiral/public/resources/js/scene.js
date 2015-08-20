/**
 * Created by Tommy Fang on 7/31/2015.
 */
var _container, _scene, _camera, _renderer,
    _controls, _stats, _Animator, _FloorData, _crossFilter, _RawSignalData;
var _FloorDimensions = [];
var originAxis;
var selectedSignal = false;
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

function CreateFloor(dataset, FloorNumber) {
    //Create each floor depending on user request.
    var CurrentFloor = dataset[FloorNumber],
        image = dataset[FloorNumber].image,
    //Deserialize the floor image, which is originally converted into a base64 byte array
        FloorPlan = "data:image/png;base64," + image, //'Assets/Images/NewOfficeTS.png';
    //Load the floorplan as a texture.
        FloorTexture = new THREE.ImageUtils.loadTexture(FloorPlan);
    FloorTexture.minFilter = THREE.LinearFilter;
    //Set up the properties of the floor plan.
    var FloorMaterial = new THREE.MeshBasicMaterial({
            map: FloorTexture,
            side: THREE.DoubleSide,
            //Prevents clipping when viewing from underneath.
            transparent: true,
            depthWrite: false,
            //Prevents choppy rendering with other objects at the same z-index.
            frustumCulled: false
        }),
    //Hardcoded image width/height, it should probably be included in the CSV
    //There is not a built-in method to obtain the parameters of this image.
        ImageHeight = parseInt(CurrentFloor.image_height), ImageWidth = parseInt(CurrentFloor.image_width),
    //x:242, y: 121
    //Create the geometry of the floor/mesh and adjust using the floor properties given in the CSV file.
        FloorGeometry = new THREE.PlaneBufferGeometry(ImageHeight, ImageWidth, 1, 1),
        FloorMesh = new THREE.Mesh(FloorGeometry, FloorMaterial);
    // FloorMesh.scale.set(CurrentFloor.scale, CurrentFloor.scale, CurrentFloor.scale);
    scale = CurrentFloor.scale;
    //Set the floor that acts as a basis for all floors.
    var BaseFloor = dataset[0],
    //Set the position
        Altitude = parseInt(CurrentFloor.altitude),
        b_offset_z = parseInt(CurrentFloor.building_offset_z),
    //Calculate a common origin between all the floors in the same building.
    //Will need to make this more dynamic later, if we are planning to incorporate multiple buildings in the same floor.
        Origin_X = parseInt(CurrentFloor.origin_x),
        Origin_Y = parseInt(CurrentFloor.origin_y),
        BaseOrigin_X = parseInt(BaseFloor.origin_x),
        BaseOrigin_Y = parseInt(BaseFloor.origin_y);

    //Check if this is the base floor, so we don't move it too much
    //Check to see if we are in the same building and if we are, figure which one is the base floor
    //then move the other floors relative to the base floor.
    /*    FloorMesh.position.x = BaseOrigin_X + Origin_X + ImageWidth/2;//CurrentFloor.building_offset_x + CurrentFloor.Origin_X;
     FloorMesh.position.z = BaseOrigin_Y + Origin_Y - ImageHeight/2;
     FloorMesh.position.y = Altitude;// + b_offset_z;*/
    //Keep the plane flat on XZ axis!
    FloorMesh.rotation.x = -Math.PI / 2;
    FloorMesh.rotation.z = Math.PI / 2;

    //Helps us locate the origin relative to the base.
    originAxis = new THREE.AxisHelper(200);
    FloorMesh.position.x = 0;//BaseOrigin_X + Origin_X + ImageWidth/2;//CurrentFloor.building_offset_x + CurrentFloor.Origin_X;
    FloorMesh.position.z = 0;
    FloorMesh.position.y = Altitude;// + b_offset_z;
    // console.log(FloorMesh.position);
    //harded coded in to help me figure out where the points are on the map.
    var halfX = ImageWidth / 2, halfY = ImageHeight / 2;
    originAxis.position.x = -halfX + Origin_X;
    originAxis.position.y = FloorMesh.position.y;
    originAxis.position.z = -halfY + (ImageHeight - Origin_Y);
    originAxis.rotation.x = -Math.PI / 2;
    // console.log(ImageHeight + " , " + ImageWidth);
    // console.log(originAxis.position);
    var CurrentFloorDimensions = [];

    FloorGeometry.computeBoundingBox();
    //We will need this floor data later when we confine the position of signals to the bounding box of the floor.
    CurrentFloorDimensions["width"] = FloorGeometry.boundingBox.max.x - FloorGeometry.boundingBox.min.x;
    CurrentFloorDimensions["height"] = FloorGeometry.boundingBox.max.y - FloorGeometry.boundingBox.min.y;
    CurrentFloorDimensions["depth"] = FloorGeometry.boundingBox.max.z - FloorGeometry.boundingBox.min.z;
    CurrentFloorDimensions["min_x"] = (FloorGeometry.boundingBox.min.x) * CurrentFloor.scale;// + Origin_X + BaseOrigin_X;
    CurrentFloorDimensions["max_x"] = (FloorGeometry.boundingBox.max.x) * CurrentFloor.scale;// + Origin_X + BaseOrigin_X;
    CurrentFloorDimensions["min_y"] = (FloorGeometry.boundingBox.min.y) * CurrentFloor.scale;// + Origin_Y + BaseOrigin_Y;
    CurrentFloorDimensions["max_y"] = (FloorGeometry.boundingBox.max.y) * CurrentFloor.scale;//+ Origin_Y + BaseOrigin_Y;
    CurrentFloorDimensions["min_z"] = FloorGeometry.boundingBox.min.z;// + Origin_Y + BaseOrigin_Y;
    CurrentFloorDimensions["max_z"] = FloorGeometry.boundingBox.max.z;//+ Origin_Y + BaseOrigin_Y;
    CurrentFloorDimensions["scale"] = CurrentFloor.scale;
    CurrentFloorDimensions["origin_x"] = Origin_X;
    CurrentFloorDimensions["origin_y"] = Origin_Y;
    _FloorDimensions.push(CurrentFloorDimensions);
    Floors.push(FloorMesh);
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
    light.position.set(BaseOrigin_X + Origin_X, FloorMesh.position.y + 250, BaseOrigin_Y + Origin_Y);
    _scene.add(light);
    _scene.add(originAxis);
    _scene.add(FloorMesh);
}

function LoadFloors(data, FloorNumber) {
    for (var i = 0; i < FloorNumber; i++) {
        CreateFloor(data, i);
    }
}

function LoadData() {
    //Grab the data from the ajax call started in the router index.js
    LoadCSV(dataset, function (result) {
        _FloorData = result[0];
        _RawSignalData = result[1];
        if (Loading) {
            LoadFloors(_FloorData, 1);
            //Draw the floors based on number requested.
            _crossFilter = new FilterCharts(result[1]);
            //Create an instance of the charts class, allowing us to access the filters/charts and render them.
        }
        Loading = false;
    });
}
//Create the circle

function GenerateCircle(lat, long, alt, radius, id, frequency, bandwidth, tlw) {
    //Set up a cylinder geometry using above args:
    //create color based on currently toggled variable
    var signalColor, selectedLength = Object.keys(_selectedArr).length;
    frequency = (frequency / 100000).toFixed(1);
    if (tlwToggle) {
        //Creates a color based on TLW 0-10
        signalColor = tlwScale(tlw)
    }
    if (freqToggle) {
        signalColor = freqScale(frequency);
    }
    if (bwToggle) {
        signalColor = bwScale(bandwidth);
    }

    var geo_Circle = new THREE.CylinderGeometry(radius, radius, 1, 32);
    var mat_Circle = new THREE.MeshLambertMaterial({
        color: signalColor, //Set this color using a d3 scale depending on arg
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        frustumCulled: false,
        depthWrite: false, //Prevents z-fighting
        shading: THREE.SmoothShading
    });
    //Combine the mesh and material
    var Circle = new THREE.Mesh(geo_Circle, mat_Circle);
   // console.log(Object.keys(_selectedArr).length);

    if (selectedLength > 0) {
        Circle.material.color.setHex("#669999");
    }
    //Set the position based on input
    //origin_x,origin_y should be calculated based on three.js _scene positioning.
    //see documentation for more details on how the _scene is set up.
    var origin_x = _FloorDimensions[0]["origin_x"];
    var origin_y = _FloorDimensions[0]["origin_y"];

    Circle.position.x = lat;
    Circle.position.y = alt;
    Circle.position.z = long;

    //Builtin vars to help with tweening.
    //ID: TxID, active: if we are in a tween state, animations: current animation
    //selected is used by charts.js/controller.js whenever a signal is clicked.
    //When a signal is clicked on the signal list or map, the flag gets set to true and the object gets placed
    //into the _selectedSignals array.
    //Upon completion of fade out, the pointer to the object, in aforementioned array, gets deleted.
    Circle.userData = {
        id: id, animations: [], selected: false,
        freq: frequency, bw: bandwidth, TLW: tlw
        //freq,bw,tlw used by charts.css and signal generator to determine color.
    };
    //Draw the circle to the _scene.
    _scene.add(Circle);
    return Circle;
}
//Parse the signal data
function ConvertSignalToCircle(SignalPoint) {
    var lat = parseInt(SignalPoint.X),
        long = parseInt(SignalPoint.Y) * -1, //Y is Z longitude
        alt = parseInt(SignalPoint.Z),//Z is altitude(Y in three.js)
        id = parseInt(SignalPoint.TXID),

        frequency = parseInt(SignalPoint.FREQ),
        bandwidth = parseInt(SignalPoint.BW),
        tlw = parseInt(SignalPoint.TLW),
    //scales use d3 to calculate the min and max found in the csv and outputs value for the variable.
        radius = sizeScale(SignalPoint.AMP);
    lat = originAxis.position.x + (lat * scale);
    long = originAxis.position.z + (long * scale);

    //Generate circle using signal data.
    return GenerateCircle(lat, long, alt, radius, id, frequency, bandwidth, tlw);
}