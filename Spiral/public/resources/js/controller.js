/**
 * Created by tfang on 7/31/2015.
 */
var mouse = new THREE.Vector2();
//Events(Keypresses and Mouse functions)
function FindIntersects() {
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    //TODO: figure out how to select object while tweening
    //The raycaster is unable to remember the current position of the object because
    //it is always moving.
    //The intersects are the points we are checking if the mouse  hovers over.
    var intersects = raycaster.intersectObjects(scene.children);
    //If there are points to check, then we can animate them.
    if (intersects.length > 0) {
        console.log(intersects[0].object.position);
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
    var left =  Math.floor( window.innerWidth  * 0.248 );
    mouse.x = ((event.clientX - left) / renderer.domElement.width ) * 2 - 1;
    mouse.y = -((event.clientY - offset.top) / renderer.domElement.height) * 2 + 1;
   // console.log(event.clientX + ", " + event.clientY);
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
        case 76: //'l'
            event.preventDefault();
            if (!Loading) {
                    //var OrderedTimeSignals = TCodeArrayHelper(selected[0].values); //current selection of points
                   //Slice is used to play a current selection
                    var slice = selected[0].values;
                    var sliceBegin = slice[0].TCODE;
                    var sliceEnd = slice[slice.length-1].TCODE;
                    currentTimeIndex = sliceBegin;
                    var start = window.setInterval(function () {
                        DataPump();
                        // console.log(OrderedTimeSignals[currentTimeIndex]);
                        currentTimeIndex++;
                        if (currentTimeIndex > sliceEnd) {
                            currentTimeIndex = sliceBegin;// 0;
                        }

                    }, 1200);
            }
            break;
    }
}