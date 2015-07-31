var totalTimeCodes;

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
                result[0] = CSV_ARRAY[0];
                result[1] = CSV_ARRAY[1];
            }
            //Callback returns the csv files for usage in main.js
            callback(result);
        }
        //do NOT return data in this function without checking for success
        //asynchronous threads will cause it to overwrite data that was pushed in SUCCESS
        //Or it will attempt to return the data before it was written
    });

}
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
        FloorData = result[0];
        RawSignalData = result[1];

        if (Loading) {
            LoadFloors(FloorData, 1);
        }
        //AnimationQueue = new AnimationHandler();
        Loading = false;

    });

}//RawSignalArray is the CSV in [] form.  Each line is a single Signal in time.
function CSVHelper(RawSignalArray) {
    if (RawSignalArray != null) {
        var allTimeCodes = []; //this is all signals, grouped by timecode.
        var index = 0; //current line of CSV array
        var currentTime = -1;
        totalTimeCodes = 0;  //TODO:  THIS NEEDS TO BE GLOBAL
        while (index <= RawSignalArray.length-1) {
           // console.log(RawSignalArray[index]);

            if (currentTime != RawSignalArray[index].Time) {
                //new timecode, close up last SignalData[], increment currentTime
                totalTimeCodes++;
                currentTime = RawSignalArray[index].Time;
                //console.log("New Time Code Found!= " + currentTime);
                //if (allTimeCodes[currentTime] == null) {
                allTimeCodes[currentTime] = [];
                //}
            }
            allTimeCodes[currentTime].push(RawSignalArray[index]);
            index++; //move to next csv line

        }
        /*console.log("Total timecodes loaded = " + totalTimeCodes);
        console.log(allTimeCodes);*/
        return allTimeCodes;
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
