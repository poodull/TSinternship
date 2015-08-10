/**
 * Created by tfang on 7/31/2015.
 */
var mouse = new THREE.Vector2(), offset = new THREE.Vector3(),
    INTERSECTED;
var raycaster = new THREE.Raycaster(), Playing = true;
//Events(Keypresses and Mouse functions)
function FindIntersects() {
    raycaster.setFromCamera(mouse, camera);
    checkSignals();
   // scene.updateMatrixWorld();
    //TODO: figure out how to select object while tweening
    //The raycaster is unable to remember the current position of the object because
    //it is always moving.
    //The intersects are the points we are checking if the mouse  hovers over.
    var intersects = raycaster.intersectObjects(Points);

    //If there are points to check, then we can animate them.
    if (intersects.length > 0) {
        intersects[ 0 ].object.material.color.setHex( Math.random() * 0xffffff );
        console.log(intersects[0].object.position);
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
    mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
    mouse.y = -( event.clientY / renderer.domElement.height ) * 2 + 1;
    FindIntersects();

}
function onDocumentMouseMove(event) {
    //event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

}
function getCurrentSelected() {
    //Set this to an interval that checks if the current selection has changed and rerender.
    window.setInterval(function () { console.log(selected[0].values); }, 2000);
}
function OnKeyDown(event) {
    switch (event.keyCode) {
        case 46: // 'DELETE' Key, Toggle delete selected point
            Playing = !Playing;
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
                if (Playing) {
                    var OrderedTimeSignals = TCodeArrayHelper(selected[0].values); //current selection of points

                    window.setInterval(function () {
                        DataPump(OrderedTimeSignals[currentTimeIndex]);
                        // console.log(OrderedTimeSignals[currentTimeIndex]);
                        currentTimeIndex++;
                        if (currentTimeIndex >= totalTimeCodes) {
                            currentTimeIndex = 0;
                        }
                    }, 1250);
                }

            }
            break;
    }
}