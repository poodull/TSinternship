/**
 * Created by tfang on 7/31/2015.
 */
var mouse = new THREE.Vector2(), offset = new THREE.Vector3(),
    INTERSECTED;
var raycaster = new THREE.Raycaster();
var testDict = {};
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
                var OrderedTimeSignals = TCodeArrayHelper(RawSignalData);
                //console.log(test);
                //console.log(OrderedTimeSignals);
               // getCurrentSelected();
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