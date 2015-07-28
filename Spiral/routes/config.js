var express = require('express');
var router = express.Router();
/* GET home page. */
var html_dir = 'Spiral/public/';
var loader = require('csv-load-sync');
var FloorPlan = './FloorPlan.csv';
var SignalData = './SignalData.csv';
var FloorCSV = loader(FloorPlan);
var SignalCSV = loader(SignalData);
router.get('/', function(req, res, next) {
    res.sendfile('./public/config.html');

});
router.put('/', function(req, res){
   // var obj = {};
    var data = [];
    data.push(FloorCSV);
    data.push(SignalCSV);
    //console.log(fp.floor_id);
    //console.log("are you out there world? it's me, puffin");
    // console.log('body: ' + JSON.stringify(req.body));
    console.log(__dirname);
    //res.contentType('text/csv');
    res.send(data);
    //res.send(SignalCSV);

});

module.exports = router;
