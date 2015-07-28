function LoadCSV(dataset, callback) {
    var result = [];
    $.ajax({
        type: 'PUT',
        contentType: 'text/csv',
        url: 'http://localhost:1337/config',
        //CSV ARRAY CONTAINS AN ARRAY OF ALL NECESSARY CSV FILES
        success: function (CSV_ARRAY) {
            //alert(data);
            console.log('success');
            if (dataset != null) {
                for (var i = 0; i < CSV_ARRAY.length; i++) {
                    result.push(CSV_ARRAY[i]);
                }
            }
            //Callback returns the csv files for usage in main.js
            callback(result);
        }
        //do NOT return data in this function without checking for success
        //asynchronous threads will cause it to overwrite data that was pushed in SUCCESS
        //Or it will attempt to return the data before it was written
    });

}
/* $.ajax({
 type: 'PUT',
 contentType: 'text/csv',
 url: 'http://localhost:1337/config',
 //CSV ARRAY CONTAINS AN ARRAY OF ALL NECESSARY CSV FILES
 success: function (CSV_ARRAY) {
 //alert(data);
 console.log('success');
 if (dataset != null) {
 for (var i = 0; i < CSV_ARRAY.length; i++) {
 result.push(CSV_ARRAY[i]);
 }
 }
 //Callback returns the csv files for usage in main.js
 callback(result);
 }
 //do NOT return data in this function without checking for success
 //asynchronous threads will cause it to overwrite data that was pushed in SUCCESS
 //Or it will attempt to return the data before it was written
 });
 }*/
/*function ParseSignalData(SignalData) {
 for (var i = 0; i < SignalData.length; i++) {
 SignalData[i]
 }
 }*/
function GenerateCircle(pos_x, pos_y, pos_z, radius, Floor, id) {
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
    Circle.userData = {id: id, active: false, animations: [], lastUpdated: null, newPosition: false};
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
            Circle = GenerateCircle(randomX, randomY, 0, randomR, Floor, i);


        }
    }
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function ConvertSignalToCircle(SignalPoint, Floor) {
    var pos_x = parseInt(SignalPoint.Px);
    var pos_y = parseInt(SignalPoint.Py);
    var id = parseInt(SignalPoint.TxID);
    var height = parseInt(SignalPoint.Height);

    return GenerateCircle(pos_x, pos_y, height + 1, 5, Floor, id);
}

/*
function DataPump(SignalData) {
    if (!Loading) {
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
                QueueCount++;
            }

            else {
                //Tween Logic
                //Find differences and interpolate/change/color/update/etc
                QueueCount++;
                var new_pos_x = Signal.Px, new_pos_y = Signal.Py;
                var last_pos_x = SignalObject.position.x, last_pos_y = SignalObject.position.y;

                if (new_pos_x != last_pos_x || new_pos_y != last_pos_y) {
                    Points[id].userData.newPosition = true;
                    console.log("New: (" + new_pos_x + "," + new_pos_y + ")");
                    last_pos_x = new_pos_x;
                    last_pos_y = new_pos_y;
                    console.log("Last: (" + last_pos_y + "," + last_pos_y + ")");

                    //console.log(Points[id]);
                    Points[id].userData.animations["move"] = (AnimationQueue.Move(Points[id], new_pos_x, new_pos_y));
                    AnimationQueue.Enqueue(Points[id]);
                    AnimationQueue.Animate();

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
        console.log(QueueCount);
        if (AnimationQueue.Queue.length != 0) {

        }

    }
}*/
