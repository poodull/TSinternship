var t_ptr = 0;
var t2_ptr = 0;
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
               // console.log(dataset);
                /*                var SignalTimeArray = [];
                 var t = 0;
                 while (t != CSV_ARRAY[1].length) {
                 if (SignalTimeArray[t_ptr] == null) {
                 SignalTimeArray[t_ptr] = [];
                 }
                 else if (CSV_ARRAY[1][t].Time == t_ptr) {
                 SignalTimeArray[t_ptr].push(CSV_ARRAY[1][t]);
                 t++;
                 }
                 else {
                 t_ptr++;
                 }
                 }*/
                /* for (var t = 0; t < CSV_ARRAY[1].length; t++){
                 SignalTimeArray[CSV_ARRAY[1][t].Time] = (CSV_ARRAY[1][t]);
                 console.log("ARRAY: " + SignalTimeArray);
                 }*/
                result[0] = CSV_ARRAY[0]; // Floor Data
                result[1] = CSV_ARRAY[1];//SignalTimeArray[t2_ptr]; //Signal Data seperated by time;
                //setTimeout(LoadCSV, 2000);
                setTimeout(LoadCSV(dataset,callback), 20000);
                // result[1] = SignalTimeArray;
            }
            //Callback returns the csv files for usage in main.js
            callback(result);
        }
        //do NOT return data in this function without checking for success
        //asynchronous threads will cause it to overwrite data that was pushed in SUCCESS
        //Or it will attempt to return the data before it was written
    });

}
function CSVHelper(Signals) {
    if (Signals != null) {
        var SignalTimeArray = [];
        var t = 0;
        while (t != Signals.length) {
            if (SignalTimeArray[t_ptr] == null) {
                SignalTimeArray[t_ptr] = [];
            }
            else if (Signals[t].Time == t_ptr) {
                SignalTimeArray[t_ptr].push(Signals[t]);
                t++;
            }
            else {
                t_ptr++;
            }
        }
        return SignalTimeArray;
    }
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
