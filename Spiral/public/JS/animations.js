/**
 * Created by tfang on 7/31/2015.
 */
function AnimationHandler() {
    this.PopSizeIn = function (Signal) {
        return new TWEEN.Tween(Signal.scale)
            .to({
                x: 2,
                y: 2,
                z: 2
            }, 500)
            .easing(TWEEN.Easing.Bounce.In)
            .onComplete(function () {
                //console.log(Signal.userData.id + " pop -> dwell");
                Signal.userData.animations["anim"] = Dwell(Signal).start();
            });
    };
    this.Move = function (Signal, pos_x, pos_y) {
        return new TWEEN.Tween(Signal.position)
            .to({
                x: pos_x,
                y: pos_y,
                duration: 5
            }, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(function () {
                //console.log(Signal.userData.id  + " move -> dwell");
                Signal.userData.animations["anim"] = Dwell(Signal).start();
            });
    };
    var Dwell = function (Signal) {
        return new TWEEN.Tween(Signal.material)
            .to({}, 3000)
            .onComplete(function () {

                Signal.userData.animations["anim"] = FadeOut(Signal).start();
                if (Date.now() - Signal.userData.lastUpdated > 3000) {
                    Signal.userData.animations["anim"] = FadeOut(Signal).start();
                }
                else {
                    Signal.userData.animations["anim"] = Dwell(Signal).start();
                }
            });
    };

    var FadeOut = function (Signal) {
        return new TWEEN.Tween(Signal.material)
            .to({
                opacity: 0.0
            }, 1500)
            .easing(TWEEN.Easing.Exponential.In)
            .onComplete(function () {
                //Separate function
                console.log(Signal.userData.id + " fadeout");
                Signal.userData.active = false;
                Floors[0].remove(Signal);
                console.log("SIGNAL DURING FADEOUT" + Signal['index']);
                delete SignalDictionary[Signal.userData.id];
                //Points.splice(Points.indexOf(Signal), 1);
            });
    };
}
