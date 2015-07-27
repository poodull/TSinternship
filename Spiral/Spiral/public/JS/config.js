function LoadFloorPlan(dataset, callback) {
    var result = [];
    $.ajax({
        type: 'POST',
        contentType: 'text/csv',
        url: 'http://localhost:1337/config',

        success: function (floor_data) {
            //alert(data);
            console.log('success');
            if (dataset !== 'undefined') {
                for (var key in floor_data) {
                    if (floor_data.hasOwnProperty(key)) {
                        var obj = floor_data[key];
                        dataset[key] = obj;
                    }
                }
                result = dataset;
                callback(result);
            }
            //do NOT return data in this function without checking for success
            //asynchronous threads will cause it to overwrite data that was pushed in SUCCESS
            //Or it will attempt to return the data before it was written
        }
    });
}

function RecordClass(time, value) {
    this.time = time;
    this.value = value;
}
function SignalClass() {
    this.parameters = [];
    this.findValue = function (time) {
        //Divide and conquer algorithm
    };
    this.getInterpolatedValue = function (time) {
        //do stuff
    }
}
var Binding = function(signal, object){
    this.signal = signal;
    this.object = object;
    this.applyTime = function(t){
        var val = this.signal.getInterpolatedValue(t);
        for(var p in val){
            if(val.hasOwnProperty(p)){
                this.object[p] = val[p]; //copying values into object
            }
        }
    }
};
var Simulator = function(){
    this.time = 0;
    this.bindings = [];
    this.step = function(timeDelta){
        this.time += timeDelta;
        var time = this.time;
        this.bindings.forEach(function(b){
            b.applyTime(time);
        });
    }
};
function GenerateCircle(pos_x, pos_y, pos_z, radius,Floor,id) {
    var geo_Circle = new THREE.CylinderGeometry(radius, radius, 2, 32);
    var mat_Circle = new THREE.MeshLambertMaterial({
        color: Math.random() * 0xffffff,
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
    Circle.userData = {id: id, active: false, animations: []};
    Points.push(Circle);
    Floor.add(Circle);
    return Circle;
}

function EventPublisher(min_x, max_x, min_z, max_z, Floor, FloorData, numCircles) {
    var RandomCircles = true;
    if (RandomCircles) {
        var randomX;
        var randomY;
        var randomR;
        var Circle;
        //var FloorScale = FloorData.scale;
        var floor_id = FloorData["floor_id"];

        for (var i = 0; i < numCircles; i++) {
            randomR = Math.round(Math.random() * (10 - 5)) + 5;
            randomX = Math.floor(Math.random() * (max_x - min_x) + min_x);// * FloorScale;
            randomY = Math.floor(Math.random() * (max_z - min_z) + min_z);// * FloorScale;
            Circle = GenerateCircle(randomX, randomY, 0, randomR, Floor,i);

        }
    }
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function DataPump() {
    if (!Loading) {
        //Load 80% circles randomly individually
        var Length = parseFloat(Points.length);
        //console.log(Length);
        var testArray = [];
        var percentLength = Math.floor(parseFloat(Points.length * 0.8));
        //console.log(percentLength);
        var random;
        var i = 0;
        while (i < percentLength) {
            random = getRandomInt(0, percentLength);
            testArray[random] = Points[random];
            que.Enqueue(testArray[random]);
            i++;
        }
        que.Animate();
    }
}