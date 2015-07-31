//////////
// MAIN //
//////////
// standard global variables
var currentTimeIndex = 0;
var Floors = [], dataset = [];
var Loading = true;
var SignalDictionary = {};
var RawSignalData, FloorData, Animator;

$(document).ready(function () {
    // initialization
    init();
    // animation loop
    animate();

});

function DataPump(SignalData) {
    if (!Loading) {
        done = false;
        var Signal, id;
        for (var i = 0; i < SignalData.length; i++) {

            Signal = SignalData[i];
            id = parseInt(Signal.TxID);

            if (SignalDictionary[id] == null) {
                var currentPoint = ConvertSignalToCircle(Signal, Floors[0]);
                currentPoint.userData.active = true;
                currentPoint.userData.lastUpdated = Date.now();
                SignalDictionary[id] = currentPoint;
                currentPoint.userData.animations["anim"] = Animator.PopSizeIn(currentPoint).start();

            }
            else {
                SignalDictionary[id].userData.lastUpdated = Date.now();
                //Tween Logic
                //Find differences and interpolate/change/color/update/etc
                var newX = Signal.Px, newY = Signal.Py;
                var currentX = SignalDictionary[id].position.x, currentY = SignalDictionary[id].position.y;

                newX = Signal.Px - currentX;
                newY = Signal.Py - currentY;

                SignalDictionary[id].userData.animations["anim"].stop();
                SignalDictionary[id].userData.animations["anim"] = Animator.Move(SignalDictionary[id], newX, newY).start();

            }
        }
        console.log("updated: " + SignalData.length + " total: " + SignalDictionary.length);
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
    renderer.render(scene, camera);
}
