var dataset = [];

function LoadFloorPlan(dataset, callback){
    var result = [];
    $.ajax({
        type: 'POST',
        contentType: 'text/csv',
        url: 'http://localhost:1337/config',

        success: function (floor_data) {
            //alert(data);
            console.log('success');
            console.log(floor_data);

            if (dataset !== 'undefined') {
                for (var key in floor_data) {
                    if (floor_data.hasOwnProperty(key)) {
                        var obj = floor_data[key];
                        dataset[key] = obj;
                        //console.log(obj);
                        // console.log(dataset[key]);
                        //  dataset = datase
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
