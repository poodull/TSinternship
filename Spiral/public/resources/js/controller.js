/**
 * Created by Tommy Fang on 7/31/2015.
 */
var _mouse = new THREE.Vector2();
var _signalSelected = false, _points = [];
//Events(Keypresses and Mouse functions)
function CheckSignals(){
    //We only want to check the current points in the signal dictionary
    //Clear the array each on click and check which points are currently on screen
    _points = [];
    for (var id in _signalDictionary) {
        if (_signalDictionary.hasOwnProperty(id)) {
            _points.push(_signalDictionary[id]);
        }
    }
}
function FindIntersects() {
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(_mouse, _camera);
    //TODO: figure out how to select object while tweening
    //The intersects are the points we are checking if the _mouse  hovers over.
    CheckSignals();
    var intersects = raycaster.intersectObjects(_points);
    var intersectedPoint, signal;

    //If there are points to check, then we can animate them.
    if (intersects.length > 0) {
        intersectedPoint = intersects[0];
        signal = intersectedPoint.object;
        //intersects[ 0 ].object.material.color.setHex( Math.random() * 0xffffff );
        signal.userData.selected = !signal.userData.selected;
       if ( signal.userData.selected ) {
            if (_selectedArr[signal.userData.id] == null) {
                _selectedArr[signal.userData.id] = signal;
            }
        }
       else if (!signal.userData.selected) {
           delete _selectedArr[signal.userData.id];
       }
    }
}


function onDocumentTouchStart(event) {
    event.preventDefault();
    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;
    onDocumentMouseDown(event);
}

function onDocumentMouseDown(event) {
    event.preventDefault();
    var offset = $('#ThreeJS').offset();
    var top = offset.top;
    var left =  Math.floor( window.innerWidth  * 0.248 );
    _mouse.x = ((event.clientX - left) / _renderer.domElement.width ) * 2 - 1;
    _mouse.y = -((event.clientY - top) / _renderer.domElement.height) * 2 + 1;
  //  console.log(_mouse.x + ", " + _mouse.y);
    //the range of the _mouse space includes(-1 to 1);
    //It uses floats to convert the actual space of the window
    //to this new coordinate system.
    FindIntersects();
}
function onDocumentMouseMove(event) {
    event.preventDefault();
    var offset = $('#ThreeJS').offset();

    _mouse.x = ( (event.clientX - offset.left ) / _renderer.domElement.width ) * 2 - 1;
    _mouse.y = -( (event.clientY - offset.top ) / _renderer.domElement.height ) * 2 + 1;
}
function onWindowResize() {
    _camera.aspect = window.innerWidth / window.innerHeight;
    _camera.updateProjectionMatrix();
    _renderer.setSize(window.innerWidth, window.innerHeight);

}
//Listens for all key presses
//Look up Javascript key codes to bind new functions to keys.
function OnKeyDown(event) {
    switch (event.keyCode) {
        case 46: // 'DELETE' Key, Toggle delete _filteredSelection point
            break;
        case 45: //'INSERT' Key, add one single point
            FilteredTCodeArray([_filteredSelection[0].values]);
            break;
        case 35:
            // RemovePoints(); //Remove point when clicked!
            break;
        case 76: //'L'
            event.preventDefault();
            if (!_loading) {

                   //Slice is used to play a current selection
                    var slice = _filteredSelection[0].values;
                  //  var testArray = TCodeArrayHelper(_rawSignalData);
                //console.log(testArray);
                    //Slice is sorted by time code values
                    //Therefore, the first index has the first tcode.
                    var sliceBegin = slice[0].TCODE;

                //The last index has the last tcode
                    var sliceEnd = slice[slice.length-1].TCODE;
                    //Set the beginning timecode of the loop
                    _currentTimeIndex = sliceBegin;
                    _signalSelected = false;
                var play = window.setInterval(function () {
                        DataPump();
                 //   _crossFilter.updateFilter(sliceBegin, sliceBegin + 1);

                    _currentTimeIndex++;

                        //If the loop ends, then start over.
                        //console.log(_currentTimeIndex);
                        if (_currentTimeIndex > sliceEnd) {
                            _currentTimeIndex = sliceBegin;// 0;
                        }

                    }, 200);//Time it takes to finish an interval and then repeat.

            }
            break;
    }
}