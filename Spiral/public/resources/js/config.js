/**
 * Created by Tommy Fang
 */
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
//RawSignalArray is the CSV in [] form.  Each line is a single Signal in time.
function TCodeArrayHelper(RawSignalArray) {
    if (RawSignalArray != null) {
        var allTimeCodes = [], //this is all signals, grouped by timecode.
            index = 0, currentTime = -1;  //current line of CSV array
        totalTimeCodes = 0;
        while (index <= RawSignalArray.length - 1) {
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
