/**
 * Created by Tommy Fang
 */
function LoadCSV(dataset, callback) {
    var result = [];

    $.ajax({
        type: 'PUT',
        contentType: 'text/csv',
        //url: string containing the url to which  the request is sent
        url: 'http://localhost:1337/',
        //CSV ARRAY CONTAINS AN ARRAY OF ALL NECESSARY CSV FILES
        success: function (CSV_ARRAY) {
            //alert(data);
            if (dataset != null) {
                result[0] = CSV_ARRAY[0];
                result[1] = CSV_ARRAY[1];
                //Store the result using a callback function
                //Result is sent to _charts.js (crossfilter/d3.js) and scene.js(three.js) upon load
            }
            //Callback returns the csv files for usage in main.js
            callback(result);
        }
        //do NOT return data in this function without checking for success
        //asynchronous threads will cause it to overwrite data that was pushed in SUCCESS
        //Or it will attempt to return the data before it was written
    });

}
//RawSignalArray is the CSV in [] form.  Each line is a single Signal in time.
function TCodeArrayHelper(RawSignalArray) {
    if (RawSignalArray != null) {
        var allTimeCodes = [], //this is all signals, grouped by timecode.
            index = 0, currentTime = -1, //current line of CSV array
        totalTimeCodes = 0,
        SignalLength = RawSignalArray.length - 1;
        while (index <= SignalLength) {
            // console.log(RawSignalArray[index]);
            if (currentTime != RawSignalArray[index].TCODE) {
                //new timecode, close up last SignalData[], increment currentTime
                totalTimeCodes++;
                currentTime = RawSignalArray[index].TCODE;
                //console.log("New Time Code Found!= " + currentTime);
                allTimeCodes[currentTime] = [];
            }
            allTimeCodes[currentTime].push(RawSignalArray[index]);
            index++; //move to next csv line

        }
        /*console.log("Total timecodes loaded = " + totalTimeCodes);
         console.log(allTimeCodes);*/
        return allTimeCodes;
    }
}
//Helper function to produce random integers.
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
