function LoadFloorPlan(dataset, callback){
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

function GenerateCircle(pos_x, pos_y, pos_z, radius) {
    var geo_Circle = new THREE.CylinderGeometry(radius,radius , 5, 32);
    var mat_Circle = new THREE.MeshLambertMaterial({
        color: Math.random() * 0xffffff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        frustumCulled: false,
        depthWrite: false
    });

    var Circle = new THREE.Mesh(geo_Circle, mat_Circle);
    Circle.position.x = pos_x;
    Circle.position.y = pos_y; //+ geo_Cube.height;
    Circle.position.z = pos_z;//Math.random() * 800 - 400;
    //Circle.rotation.x = Math.PI / 2;
    Points.push(Circle);
    return Circle;
}

function EventPublisher(min_x, max_x, min_z, max_z, Floor, FloorData, numCircles, scene) {
    var RandomCircles = true;
    var QueueTest = true;
    if (RandomCircles) {
        if (QueueTest) {
            var que = new AnimationQueue();
        }
        var randomX;
        var randomZ;
        var randomR;
        var Circle;
        var FloorScale = FloorData.scale;
        var floor_id = FloorData["floor_id"];
        var fixedY = Floor.position.y + (1 * FloorScale );
        for (var i = 0; i < numCircles; i++) {
            randomR = Math.round(Math.random()* (50 - 20)) + 20;
            randomX = Math.floor(Math.random() * (max_x - min_x) + min_x);// * FloorScale;
            randomZ = Math.floor(Math.random() * (max_z - min_z) + min_z);// * FloorScale;
            Circle = GenerateCircle(randomX, fixedY + 1, randomZ, randomR);

            if (QueueTest) {
                que.Enqueue(Circle);
                que.Animate(Circle);
            }
            scene.add(Circle);
        }
    }
}