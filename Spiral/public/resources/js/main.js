/**
 * Created by Tommy Fang
 */
//////////
// MAIN //
//////////
// standard global variables
var scale, currentTimeIndex = 0,
    //currentTimeIndex keeps track of the current time selection
    Floors = [],dataset = [],
    //These are used to hold the data we receive
    Loading = true,
    //Loading is used as a flag variable
    //We set it to false, after receiving the data from data.js
    SignalDictionary = {},
    //SignalDictionary holds all the objects are currently being visualized.
    //SignalDictionary objects are indexed by TxID
    selected = [];
    //The current filtered selection updates as a global,
    //so we constantly know what the filtered selection is
$(document).ready(function () {
    // initialization
    init();
    // animation loop
    animate();
});
//Pumps signal data to the animation handler.
function DataPump() {
    if (!Loading) {
        //necessary local variables
        var Signal, id, i;
        //Sends the current filtered parameters to chart.js and renders
        //the selected data across all charts.
        CrossFilter.updateFilter(currentTimeIndex, currentTimeIndex + 1);
        //TODO: Prompt user to pick a selection when the length is 0
        //current works as intended.
        var currentFilter = selected[0].values;//SignalData.length
        //var geo_Circle = new THREE.CylinderGeometry(radius, radius, 10, 32),
        var length = currentFilter.length;
        //Signal data is an array of the current time slice that we are observing.
        for (i = 0; i < length; i++) {
            //Loop through this time slice
            Signal = currentFilter[i];
            id = parseInt(Signal.TXID);
            //If this Signal Object does NOT exist:
            if (SignalDictionary[id] == null) {
                //Convert it to an object
                var currentPoint = ConvertSignalToCircle(Signal);
                //Flag its active state
                //Set the index key in the dictionary to this object value.
                SignalDictionary[id] = currentPoint;
                //Set the current animation of the object to "pop" and start.
                currentPoint.userData.animations.anim = Animator.PopSizeIn(currentPoint).start();

            }
            //else if the signal object already exists in the dictionary.
            else {
                //Tween Logic
                //Find differences and interpolate/change/color/update/etc
                //newX,newZ are part of the new signal data that we recieve.
                var newY =  (-997.5*scale) + (Signal.Y*scale*scale), newX = -(-492.5*scale - (Signal.X*scale*scale));
              //  console.log("NEW:" + newX + " , " + newY);
                //Because we are adding the point to the three.js scene. the Y axis is up.
                //Tell the last animation to stop because we've recieved a new update.
                SignalDictionary[id].userData.animations.anim.stop();

                //Set the current animation to move.
                SignalDictionary[id].userData.animations.anim = Animator.Move(SignalDictionary[id], newX, newY).start();

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
    //This sets the viewport location. The top/bottom are unaffected because
    //I move the div down instead, if it causes problems using full screen
    //adjust the bottom and height of the renderer accordingly to fit the space.
    var left   = Math.floor( window.innerWidth  * 0.248 );
    var bottom = 0;
    var width  = Math.floor( window.innerWidth );
    var height = Math.floor( window.innerHeight );
    renderer.setViewport( left, bottom, width, height );
    renderer.setScissor( left, bottom, width, height );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.enableScissorTest ( true );
    //renderer.setClearColor( new THREE.Color().setRGB( 0.5, 0.5, 0.7 ) );
    renderer.render(scene, camera);
}
