 var express = require('express');
 var router = express.Router();
 var loader = require('csv-load-sync');
 var path = require('path');
 var d3 = require("d3");
 var fs = require('fs');

//Relative pathing
 var floorPlan = 'public/resources/data/FloorPlan.csv';
 // ".." goes back one from the parent __dir
 var floorPath = path.join(__dirname, '..', floorPlan);
 //insert name of file here
 var signalData = 'public/resources/data/devdata_smooth5.csv';
 var signalPath = path.join(__dirname, '..', signalData);
 var floorCSV = loader(floorPath);


 router.get('/', function (req, res) {
 res.sendfile('./public/index');
 });

 router.put('/', function (req, res) {
 var data = [];
 data.push(floorCSV);
 fs.readFile(signalPath, "utf8", function(error, csvdata) {
 csvdata = d3.csv.parse(csvdata);
 data.push(csvdata);
 res.send(data);

 });

 });

 module.exports = router;
