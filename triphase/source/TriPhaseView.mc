using Toybox.Graphics;
using Toybox.Lang;
using Toybox.System;
using Toybox.WatchUi;

// Watch face view. All rendering is delegated to Painter; this class only
// tracks power state and the burn-in requirement (spec section 8).
class TriPhaseView extends WatchUi.WatchFace {

    var _lowPower as Lang.Boolean = false;
    var _burnIn as Lang.Boolean = false;

    function initialize() {
        WatchFace.initialize();
        var ds = System.getDeviceSettings();
        _burnIn = (ds has :requiresBurnInProtection) && ds.requiresBurnInProtection;
    }

    function onLayout(dc as Graphics.Dc) as Void {
        Geom.init(dc);
    }

    function onShow() as Void {
    }

    function onHide() as Void {
    }

    function onUpdate(dc as Graphics.Dc) as Void {
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
    function onPartialUpdate(dc as Graphics.Dc) as Void {
        if (!_burnIn && Config.showSeconds()) {
            Painter.drawSecondsPartial(dc);
        }
    }

    // onEnterSleep / onExitSleep switch layouts, not just dim them: Painter
    // drops the weekday strip, seconds, ticks and background glow entirely in
    // low power and draws only the aodFields subset.
    function onEnterSleep() as Void {
        _lowPower = true;
        WatchUi.requestUpdate();
    }

    function onExitSleep() as Void {
        _lowPower = false;
        WatchUi.requestUpdate();
    }
}
