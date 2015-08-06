/**
 * Created by tfang on 7/31/2015.
 */
var mouse = new THREE.Vector2(), offset = new THREE.Vector3(),
    INTERSECTED;
var raycaster = new THREE.Raycaster();
//Events(Keypresses and Mouse functions)
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
    //AddPoint();
   // RemovePoint();
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
            Remove = !Remove;
            break;
        case 45: //'INSERT' Key, add one single point
            break;
        case 35:
            //
            // RemovePoints(); //Remove point when clicked!
            break;
        case 76: //'l'
            event.preventDefault();
            if (!Loading) {
               // var OrderedTimeSignals = TCodeArrayHelper(RawSignalData);
                // getCurrentSelected();
                //On apply filter:
                //window.clearInterval(intervalId);
                //remove all tweens
                //get new selection
                //play interval
                var OrderedTimeSignals = TCodeArrayHelper(selected[0].values); //current selection of points
                console.log(charts[3].filter([0, 1]));
                setInterval(function () {

                    DataPump(OrderedTimeSignals[currentTimeIndex]);
                    currentTimeIndex++;
                    if (currentTimeIndex >= totalTimeCodes) {
                        currentTimeIndex = 0;
                    }
                }, 1250);
            }
            break;
    }
}