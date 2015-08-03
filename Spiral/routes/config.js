var express = require('express');
var router = express.Router();
/* GET home page. */
var html_dir = 'Spiral/public/';
var loader = require('csv-load-sync');
var FloorPlan = 'C:/Users/tfang/IdeaProjects/Spiral/public/resources/data/FloorPlan.csv';
var SignalData = 'C:/Users/tfang/IdeaProjects/Spiral/public/resources/data/SignalData.csv';
var FloorCSV = loader(FloorPlan);
var SignalCSV = loader(SignalData);
var fs = require('fs');
//module.exports = require("C:/Users/tfang/IdeaProjects/Spiral/public/vendors/crossfilter").crossfilter;

router.get('/', function (req, res) {
    res.sendfile('./public/config.html');

});

router.put('/', function (req, res) {
    var data = [];
    data.push(FloorCSV);
    data.push(SignalCSV);
    res.send(data);

});

module.exports = router;
