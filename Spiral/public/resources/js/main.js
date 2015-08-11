/**
 * Created by Tommy Fang
 */
//////////
// MAIN //
//////////
// standard global variables
var currentTimeIndex = 0;
var Floors = [], dataset = [];
var Loading = true;
var SignalDictionary = {};
var RawSignalData;
var selected = [];
var Points = [];
$(document).ready(function () {
    // initialization
    init();
    // animation loop
    animate();
});
function checkSignals(){
    Points = [];
    for (var key in SignalDictionary) {
        Points.push(SignalDictionary[key]);
    }
}
//Pumps signal data to the animation handler.
function DataPump(SignalData) {
    if (!Loading) {
        //necessary local variables
        var Signal, id, i;
      //  checkSignals();
        CrossFilter.updateFilter(currentTimeIndex, currentTimeIndex + 1);
      //  console.log(selected[0].values);
        //console.log(SignalData[0].TCODE);
        //TODO: do something when selected length is 0

        //current works as intended.
        var currentFilter = selected[0].values;//SignalData.length

        //Signal data is an array of the current time slice that we are observing.
        for (i = 0; i < currentFilter.length; i++) {
            //Loop through this time slice
            Signal = currentFilter[i];
            id = parseInt(Signal.TXID);
            //If this Signal Object does NOT exist:
            if (SignalDictionary[id] == null) {
                //Convert it to an object
                var currentPoint = ConvertSignalToCircle(Signal);
                //Flag its active state
                currentPoint.userData.active = true;
                //Keep track of the time it was last updated.
                currentPoint.userData.lastUpdated = Date.now();
                //Set the index key in the dictionary to this object value.
                SignalDictionary[id] = currentPoint;
                //Set the current animation of the object to "pop" and start.
                currentPoint.userData.animations.anim = Animator.PopSizeIn(currentPoint).start();

            }
            //else if the signal object already exists in the dictionary.
            else {
                SignalDictionary[id].userData.lastUpdated = Date.now();
                //Tween Logic
                //Find differences and interpolate/change/color/update/etc
                //newX,newZ are part of the new signal data that we recieve.
                var newX = Signal.X, newZ = Signal.Y,
                    currentX = SignalDictionary[id].position.x, currentZ = SignalDictionary[id].position.z;
                //Because we are adding the point to the three.js scene. the Y axis is up.
                //As of 7/31/2015, SignalData gives us a pixel position(x,y)

                //We will have to adjust to that.
                console.log("current: " + currentX + "," + currentZ);
                console.log("before new values:" + newX + "," + newZ);
                //Tell the last animation to stop because we've recieved a new update.
                SignalDictionary[id].userData.animations.anim.stop();

               // newX = (Signal.X - currentX);
               // newZ = (Signal.Y - currentZ);
                newX *= 8;
                newZ *= 8;

                //Set the current animation to move.
                SignalDictionary[id].userData.animations.anim = Animator.Move(SignalDictionary[id], newX, newZ).start();

                //ANIMATION CHAIN: If !exists --> pop --> dwell --> fade
                //                 else --> move --> dwell --> fade
                // If the object receives an update in between these stages, it will either go back to pop or move.

            }
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    render();
    update();

}

function update() {
    controls.update();
    stats.update();
}

function render() {
    TWEEN.update();
    var left   = Math.floor( window.innerWidth  * 0.15 );
    var bottom = 0;
    var width  = Math.floor( window.innerWidth );
    var height = Math.floor( window.innerHeight );
    renderer.setViewport( left, bottom, width, height );
    renderer.setScissor( left, bottom, width, height );
    renderer.enableScissorTest ( true );
    //renderer.setClearColor( new THREE.Color().setRGB( 0.5, 0.5, 0.7 ) );
    renderer.render(scene, camera);
}
