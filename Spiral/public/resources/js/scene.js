/**
 * Created by Tommy Fang on 7/31/2015.
 */
var container, scene, camera, renderer,
    controls, stats, Animator, FloorData, CrossFilter, RawSignalData;

function init() {
    //Create the scene
    scene = new THREE.Scene();
    Animator = new AnimationHandler();

    // set the view size in pixels (custom or according to window size)
    // var SCREEN_WIDTH = 400, SCREEN_HEIGHT = 300;
    var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
    // camera attributes
    var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 10, FAR = 80000;
    // set up camera
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    //A perspective camera that allows us to freely view the scene.
    // add the camera to the scene
    scene.add(camera);
    // the camera defaults to position (0,0,0)
    // so pull it back (z = 1500) and up (y = 4000) and set the angle towards the scene origin
    camera.position.set(0, 1500, 4000);
    camera.lookAt(scene.position);

    // create and start the renderer; choose antialias setting.
    if (Detector.webgl) {
        renderer = new THREE.WebGLRenderer({antialias: true});
    } else {
        renderer = new THREE.CanvasRenderer();
    }
    //Adjust the renderer view size
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

    //Covers the entire scene and all objects in a yellowish light
    var ambientLight = new THREE.AmbientLight(0xffff00);
    scene.add(ambientLight);

    //obtain necessary Data through data.js
    LoadData();
    //Paints the background black
    // fog must be added to scene before first render
    scene.fog = new THREE.FogExp2(0x9999ff, 0);
    // without a Skybox or Fog effect of these, the scene's background color is determined by web page background
    // make sure the camera's "far" value is large enough so that it will render the skyBox!
    /* var skyBoxGeometry = new THREE.SphereGeometry(20000, 100, 100);//20000, 20000 );
     var skyBoxMaterial = new THREE.MeshBasicMaterial({color: 0x9999ff, side: THREE.BackSide});
     var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
     scene.add(skyBox);*/

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('touchstart', onDocumentTouchStart, false);
    document.addEventListener('keydown', OnKeyDown, false);
    window.addEventListener('resize', onWindowResize, false);

}

function CreateFloor(dataset, FloorNumber, FloorDimensions) {
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
        ImageHeight = 1985, ImageWidth = 995,
        //x:242, y: 121
    //Create the geometry of the floor/mesh and adjust using the floor properties given in the CSV file.
        FloorGeometry = new THREE.PlaneBufferGeometry(ImageWidth, ImageHeight, 1, 1), FloorMesh = new THREE.Mesh(FloorGeometry, FloorMaterial);
    FloorMesh.scale.set(CurrentFloor.scale, CurrentFloor.scale, CurrentFloor.scale);
    scale = CurrentFloor.scale;
    // console.log(FloorMesh);
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
     FloorMesh.rotation.x = -Math.PI / 2;
    //Helps us locate the origin relative to the base.
    var origin = new THREE.AxisHelper(200);
    //harded coded in to help me figure out where the points are on the map.
    origin.position.x = -497.5 * CurrentFloor.scale;
    origin.position.y = FloorMesh.position.y;
    origin.position.z = -992.5 * CurrentFloor.scale;
    var CurrentFloorDimensions = [];

    FloorGeometry.computeBoundingBox();
    //We will need this floor data later when we confine the position of signals to the bounding box of the floor.
    CurrentFloorDimensions["width"] = FloorGeometry.boundingBox.max.x - FloorGeometry.boundingBox.min.x;
    CurrentFloorDimensions["height"] = FloorGeometry.boundingBox.max.y - FloorGeometry.boundingBox.min.y;
    CurrentFloorDimensions["depth"] = FloorGeometry.boundingBox.max.z - FloorGeometry.boundingBox.min.z;
    CurrentFloorDimensions["min_x"] = (FloorGeometry.boundingBox.min.x)*CurrentFloor.scale;// + Origin_X + BaseOrigin_X;
    CurrentFloorDimensions["max_x"] = (FloorGeometry.boundingBox.max.x)*CurrentFloor.scale;// + Origin_X + BaseOrigin_X;
    CurrentFloorDimensions["min_y"] = (FloorGeometry.boundingBox.min.y)*CurrentFloor.scale;// + Origin_Y + BaseOrigin_Y;
    CurrentFloorDimensions["max_y"] = (FloorGeometry.boundingBox.max.y)*CurrentFloor.scale;//+ Origin_Y + BaseOrigin_Y;
    CurrentFloorDimensions["min_z"] = FloorGeometry.boundingBox.min.z;// + Origin_Y + BaseOrigin_Y;
    CurrentFloorDimensions["max_z"] = FloorGeometry.boundingBox.max.z;//+ Origin_Y + BaseOrigin_Y;
    CurrentFloorDimensions["scale"] = CurrentFloor.scale;
    FloorDimensions.push(CurrentFloorDimensions);
    Floors.push(FloorMesh);
    /*  //After drawing the floors, ask for how many circles to draw.
     var inputCircles = prompt("Floor # " + FloorNumber + ": How many circles? ");
     //Config.js function sends us circle data and we draw them depending on the boundaries of floor.
     CurrentFloorDimensions["min_y"], CurrentFloorDimensions["max_y"],
     FloorMesh, CurrentFloor, inputCircles, scene);*/
    //Add custom lighting function later
    //A point light(hex color, intensity, distance) can be placed
    //using light.position.set(x,y,z);

    //It acts as a light bulb, shining in all directions at the position.
    var light = new THREE.PointLight(0xffff00, 1, 0);
    light.position.set(BaseOrigin_X + Origin_X, FloorMesh.position.y + 250, BaseOrigin_Y + Origin_Y);
    scene.add(light);
    scene.add(origin);
    scene.add(FloorMesh);
}

function LoadFloors(data, FloorNumber) {
    var FloorDimensions = [];
    for (var i = 0; i < FloorNumber; i++) {
        CreateFloor(data, i, FloorDimensions);
    }
}

function LoadData() {
    //Grab the data from the ajax call started in config.js
    LoadCSV(dataset, function (result) {
        FloorData = result[0];
        RawSignalData = result[1];
        if (Loading) {
            LoadFloors(FloorData, 1);
            //Draw the floors based on number requested.
            CrossFilter = new FilterCharts(result[1]);
            //Create an instance of the charts class, allowing us to access the filters/charts and render them.
        }
        Loading = false;
    });
}
//Create the circle

function GenerateCircle(pos_x, pos_y, pos_z, radius, id, frequency, bandwidth, tlw) {
    //Set up a cylinder geometry using above args:
    //create color based on currently toggled variable
    var signalColor;
    frequency = (frequency / 100000).toFixed(1);
    //Creates a color based on TLW 0-10
    if (tlwToggle) {
        signalColor = tlwScale(tlw)
    }
    if (freqToggle) {
        signalColor = freqScale(frequency);
    }
    if (bwToggle) {
        signalColor = bwScale(bandwidth);
    }
    var geo_Circle = new THREE.CylinderGeometry(radius, radius, 2, 32);
    var mat_Circle = new THREE.MeshLambertMaterial({
        color: signalColor, //Set this color using a d3 scale depending on arg
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        frustumCulled: false,
        depthWrite: false, //Prevents z-fighting
        depthTest: false,
        shading: THREE.SmoothShading
    });
    //Combine the mesh and material
    var Circle = new THREE.Mesh(geo_Circle, mat_Circle);

    //Set the position based on input
    var origin_x = -492.5 * scale;
    var origin_y = -997.5 * scale ;

    Circle.position.x = origin_x - pos_y;
    Circle.position.y = 0;
    Circle.position.z = origin_y + pos_x;


    //Builtin vars to help with tweening.
    //ID: TxID, active: if we are in a tween state, animations: current animation
    Circle.userData = {
        id: id, animations: [], selected: false,
        freq: frequency, bw: bandwidth, TLW: tlw
    };
    //Draw the circle to the scene.
    scene.add(Circle);
    return Circle;
}
//Parse the signal data
function ConvertSignalToCircle(SignalPoint) {
    var pos_x = parseInt(SignalPoint.Y),
        pos_y = parseInt(SignalPoint.X),
        pos_z = parseInt(SignalPoint.Z),
        id = parseInt(SignalPoint.TXID),

        frequency = parseInt(SignalPoint.FREQ),
        bandwidth = parseInt(SignalPoint.BW),
        tlw = parseInt(SignalPoint.TLW),
    //scales use d3 to calculate the min and max found in the csv and outputs value for the variable.
        radius = sizeScale(SignalPoint.AMP);
    pos_x = pos_x * Math.pow(scale,2);
    pos_y = pos_y * Math.pow(scale,2);

    //Generate circle using signal data.
    return GenerateCircle(pos_x, pos_y ,pos_z, radius, id, frequency, bandwidth, tlw);
}