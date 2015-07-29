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
                    //result.push(CSV_ARRAY[i]);
                    result[i] = CSV_ARRAY[i];
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
