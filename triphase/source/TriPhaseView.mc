using Toybox.WatchUi;
using Toybox.Graphics;
using Toybox.System;

// Watch face view. All rendering is delegated to Painter; this class only
// tracks power state and the burn-in requirement (spec section 8).
class TriPhaseView extends WatchUi.WatchFace {

    var _lowPower = false;
    var _burnIn = false;

    function initialize() {
        WatchFace.initialize();
        var ds = System.getDeviceSettings();
        _burnIn = (ds has :requiresBurnInProtection) && ds.requiresBurnInProtection;
    }

    function onLayout(dc) {
        Geom.init(dc);
    }

    function onShow() {
    }

    function onHide() {
    }

    function onUpdate(dc) {
        if (!Geom.initialized) {
            Geom.init(dc);
        }
        dc.clearClip();
        Painter.drawFace(dc, _lowPower, _burnIn);
    }

    // Only the seconds region is ever redrawn here, inside a clip, to stay
    // within the 30ms partial-update budget (spec sections 8-9). Partial
    // updates only fire in low power; on MIP-style devices they keep the
    // seconds ticking, while on AMOLED (burn-in protected) devices seconds
    // are not drawn in low power at all.
    function onPartialUpdate(dc) {
        if (!_burnIn && Config.showSeconds()) {
            Painter.drawSecondsPartial(dc);
        }
    }

    // onEnterSleep / onExitSleep switch layouts, not just dim them: Painter
    // drops the weekday strip, seconds, ticks and background glow entirely in
    // low power and draws only the aodFields subset.
    function onEnterSleep() {
        _lowPower = true;
        WatchUi.requestUpdate();
    }

    function onExitSleep() {
        _lowPower = false;
        WatchUi.requestUpdate();
    }
}
