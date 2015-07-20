var express = require('express');
var router = express.Router();
//var fp;
//fp = require('../FloorPlanCSV');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: "Express",
    floorplan: fp
  });

});
router.post('/', function(req, res){
  var obj = {};
 // console.log('body: ' + JSON.stringify(req.body));
  res.contentType('text/plain');
//  res.send(fp);
});
module.exports = router;
