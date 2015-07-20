var express = require('express');
var router = express.Router();
/* GET home page. */
var html_dir = 'Spiral/public/';
var loader = require('csv-load-sync');
var filename = './FloorPlan.csv';
var csv = loader(filename);

router.get('/', function(req, res, next) {
    res.sendfile('./public/config.html');

});
router.post('/', function(req, res){
    var obj = {};
    //console.log(fp.floor_id);
    //console.log("are you out there world? it's me, puffin");
    // console.log('body: ' + JSON.stringify(req.body));
    console.log(__dirname);
   // res.contentType('text/csv');
    res.send(csv);
});
module.exports = router;
