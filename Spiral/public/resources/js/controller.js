/**
 * Created by tfang on 7/31/2015.
 */
var mouse = new THREE.Vector2();
//Events(Keypresses and Mouse functions)
function FindIntersects() {
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    //TODO: figure out how to select object while tweening
    //The intersects are the points we are checking if the mouse  hovers over.
    var intersects = raycaster.intersectObjects(scene.children);
    //If there are points to check, then we can animate them.
    if (intersects.length > 0) {
        //intersects[ 0 ].object.material.color.setHex( Math.random() * 0xffffff );
        intersects[ 0 ].object.userData.selected = !intersects[ 0 ].object.userData.selected;
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
    mouse.x = ((event.clientX - left) / renderer.domElement.width ) * 2 - 1;
    mouse.y = -((event.clientY - top) / renderer.domElement.height) * 2 + 1;
    //the range of the mouse space includes(-1 to 1);
    //It uses floats to convert the actual space of the window
    //to this new coordinate system.
    FindIntersects();
}
function onDocumentMouseMove(event) {
    event.preventDefault();
    var offset = $('#ThreeJS').offset();

    mouse.x = ( (event.clientX - offset.left ) / renderer.domElement.width ) * 2 - 1;
    mouse.y = -( (event.clientY - offset.top ) / renderer.domElement.height ) * 2 + 1;
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

}
//Listens for all key presses
//Look up Javascript key codes to bind new functions to keys.
function OnKeyDown(event) {
    switch (event.keyCode) {
        case 46: // 'DELETE' Key, Toggle delete selected point
            break;
        case 45: //'INSERT' Key, add one single point
            FilteredTCodeArray([selected[0].values]);
            break;
        case 35:
            // RemovePoints(); //Remove point when clicked!
            break;
        case 76: //'L'
            event.preventDefault();
            if (!Loading) {
                   //Slice is used to play a current selection
                    var slice = selected[0].values;
                    //Slice is sorted by time code values
                    //Therefore, the first index has the first tcode.
                    var sliceBegin = slice[0].TCODE;
                    //The last index has the last tcode
                    var sliceEnd = slice[slice.length-1].TCODE;
                    //Set the beginning timecode of the loop
                    currentTimeIndex = sliceBegin;
                    var start = window.setInterval(function () {
                        DataPump();
                        currentTimeIndex++;
                        //If the loop ends, then start over.
                        if (currentTimeIndex > sliceEnd) {
                            currentTimeIndex = sliceBegin;// 0;
                        }

                    }, 3000); //Time it takes to finish an interval and then repeat.
            }
            break;
    }
}