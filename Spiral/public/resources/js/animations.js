/**
 * Created by Tommy Fang on 7/31/2015.
 */
//Handles creating all necessary tweens for animations
function AnimationHandler() {
    //Take in a signal data OBJECT (contained inside _signalDictionary)
    this.PopSizeIn = function (Signal) {
        //Size bounces as it pops into existence.
        return new TWEEN.Tween(Signal.scale)
            .to({
                x: 2, //absolute values
                y: 2,
                z: 2
            }, 500)//duration of animation in milliseconds.
            .easing(TWEEN.Easing.Bounce.In) //type of easing animation
            .onComplete(function () {
                Signal.userData.animations.anim = Dwell(Signal).start();
            });
    };
    //If read in signal data with an object that already exists, we move it.
    this.Move = function (Signal, pos_x, pos_y) {
        return new TWEEN.Tween(Signal.position)
            .to({
                //These are relative positions
                x: parseInt(pos_x), //Moves Signal's current x value by "+pos_x"
                z: parseInt(pos_y) //Moves Signal's current y value by "+pos_y"
                //duration: .5
            }, 1000)//Time it takes to finish this tween in milliseconds.
            .easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(function () {
                //Chain dwell(which is an idle state), if the animation is able to finish.
                Signal.userData.animations.anim = Dwell(Signal).start();
            });
    };
    this.TweenColor = function(color,newColor) {
        return new TWEEN.Tween( color )
            .to({ color: newColor }
            , 200);
    };
    //idle state
    var Dwell = function (Signal) {
        return new TWEEN.Tween(Signal.material)
            .to({}, 1000)
            .onComplete(function () {
                //If we reach the end of the idle state, it means that there has not been any recent updates
                //So we begin the fade out animation.
                Signal.userData.animations.anim = FadeOut(Signal).start();
            });
        };
    //Helper function to cleanly remove inactive signals.
    var DeleteSignal = function (Signal) {
        _scene.remove(Signal);
        delete _signalDictionary[Signal.userData.id];
        if (Signal.userData.selected) {
            delete _selectedArr[Signal.userData.id];
        }
    };
    //delete stage
    var FadeOut = function (Signal) {
        return new TWEEN.Tween(Signal.material)
            .to({
                opacity: 0.0
            }, 1500)
            .easing(TWEEN.Easing.Exponential.In)
            .onComplete(function () {
                //If we reach the end of fade out without any updates,
                //Safely delete the signal from the dictionary.
                DeleteSignal(Signal);
            });
    };
}
