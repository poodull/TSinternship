var express = require('express');
var router = express.Router();
/* GET home page. */
var html_dir = 'Spiral/public/';
var loader = require('csv-load-sync');
var FloorPlan = 'C:/Users/tfang/IdeaProjects/Spiral/public/resources/data/FloorPlan.csv';
var SignalData = 'C:/Users/tfang/IdeaProjects/Spiral/public/resources/data/SignalData.csv';
var T2Signals = "C:/Users/tfang/IdeaProjects/Spiral/public/resources/data/T2signals.csv";
var FloorCSV = loader(FloorPlan);
var SignalCSV = loader(SignalData);
var d3 = require("d3");
var fs = require('fs');
//module.exports = require("C:/Users/tfang/IdeaProjects/Spiral/public/vendors/crossfilter").crossfilter;

router.get('/', function (req, res) {
    res.sendfile('./public/config.html');

});

router.put('/', function (req, res) {
    var data = [];
    data.push(FloorCSV);
    fs.readFile(T2Signals, "utf8", function(error, csvdata) {
        csvdata = d3.csv.parse(csvdata);
        data.push(csvdata);
        res.send(data);

    });

});

module.exports = router;
