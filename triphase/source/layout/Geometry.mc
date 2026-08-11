using Toybox.Graphics;
using Toybox.Lang;
using Toybox.Math;
using Toybox.WatchUi;

// All layout coordinates live here (spec section 11: no magic numbers in the
// painter). The reference canvas is 454x454 with center (227,227); everything
// is derived from dc dimensions via a scale factor so the layout survives a
// device with a different resolution.
//
// Fonts are the spec's custom bitmap fonts (Barlow Semi Condensed, tabular
// figures), generated per resolution by tools/gen_fonts.py and selected via
// monkey.jungle resource paths. Their tight line heights are what make the
// spec's vertical ladder actually fit - the built-in fonts are 1.5-2x taller
// than the spec sizes and made every row collide.
module Geom {

    const REF = 454.0;

    var initialized as Lang.Boolean = false;

    var w as Lang.Number = 454;
    var h as Lang.Number = 454;
    var cx as Lang.Number = 227;
    var cy as Lang.Number = 227;
    var s as Lang.Float = 1.0;

    // Fonts by role, loaded from the per-resolution resource set.
    var fontTime as WatchUi.FontResource? = null;
    var fontSeconds as WatchUi.FontResource? = null;
    var fontValueL as WatchUi.FontResource? = null;   // 32px: steps
    var fontValueM as WatchUi.FontResource? = null;   // 28-29px: calories, sub-dials
    var fontValueS as WatchUi.FontResource? = null;   // 22px: hrv/bat/sleep/hr
    var fontValueXS as WatchUi.FontResource? = null;  // 21px: int/next/sun
    var fontLabel as WatchUi.FontResource? = null;    // 11px labels
    var fontDate as WatchUi.FontResource? = null;
    var fontWeekday as WatchUi.FontResource? = null;

    // Chrome geometry
    var tickMinorIn as Lang.Number = 0;
    var tickMajorIn as Lang.Number = 0;
    var tickOut as Lang.Number = 0;
    // Precomputed tick line endpoints: [x1, y1, x2, y2] * 60, computed once
    // in init so the draw loop does no trig (spec section 9).
    var tickCoords as Lang.Array? = null;

    var wellR as Lang.Number = 0;
    var wellLeftX as Lang.Number = 0;
    var wellRightX as Lang.Number = 0;
    var wellY as Lang.Number = 0;
    var subArcR as Lang.Number = 0;
    var subArcW as Lang.Number = 2;

    var bottomArcR as Lang.Number = 0;
    var bottomArcW as Lang.Number = 3;

    // Text anchor rows (y = top of text block, x = center of block).
    // Values follow the spec section 3.2 ladder on the 454 canvas.
    var dateY as Lang.Number = 0;
    var weekdayY as Lang.Number = 0;
    var weekdayStep as Lang.Number = 0;
    var timeY as Lang.Number = 0;
    var secondsX as Lang.Number = 0;
    var secondsY as Lang.Number = 0;

    // Seconds clip region for onPartialUpdate
    var secClipX as Lang.Number = 0;
    var secClipY as Lang.Number = 0;
    var secClipW as Lang.Number = 0;
    var secClipH as Lang.Number = 0;

    // Burn-in shift amplitude
    var burnShift as Lang.Number = 1;

    // Slot descriptors, in Config.SLOT_KEYS order:
    // hrv, bat, bb, rec, cal, sleep, hr, int, next, sun, steps
    // Each: { :cx, :vy, :font, :lh (label y offset), :arc (:left/:right/:bottom/null) }
    var slots as Lang.Array<Lang.Dictionary>? = null;

    function px(v as Lang.Number) as Lang.Number {
        return (v * s + 0.5).toNumber();
    }

    function init(dc as Graphics.Dc) as Void {
        w = dc.getWidth();
        h = dc.getHeight();
        cx = w / 2;
        cy = h / 2;
        s = w / REF;

        fontTime = WatchUi.loadResource(Rez.Fonts.time82) as WatchUi.FontResource;
        fontSeconds = WatchUi.loadResource(Rez.Fonts.sec22) as WatchUi.FontResource;
        fontValueL = WatchUi.loadResource(Rez.Fonts.val32) as WatchUi.FontResource;
        fontValueM = WatchUi.loadResource(Rez.Fonts.val28) as WatchUi.FontResource;
        fontValueS = WatchUi.loadResource(Rez.Fonts.val22) as WatchUi.FontResource;
        fontValueXS = WatchUi.loadResource(Rez.Fonts.val21) as WatchUi.FontResource;
        fontLabel = WatchUi.loadResource(Rez.Fonts.label11) as WatchUi.FontResource;
        fontDate = WatchUi.loadResource(Rez.Fonts.date16) as WatchUi.FontResource;
        fontWeekday = WatchUi.loadResource(Rez.Fonts.week12) as WatchUi.FontResource;
        var fontValueSub = WatchUi.loadResource(Rez.Fonts.val29) as WatchUi.FontResource;

        tickMinorIn = px(211);
        tickMajorIn = px(207);
        tickOut = px(219);
        _computeTicks();

        wellR = px(50);
        wellLeftX = px(115);
        wellRightX = w - px(115);
        wellY = px(342);
        subArcR = px(42);
        subArcW = px(5) > 1 ? px(5) : 2;

        bottomArcR = px(145);
        bottomArcW = px(8) > 1 ? px(8) : 3;

        dateY = px(34);
        weekdayY = px(62);
        weekdayStep = px(27);
        timeY = px(127);
        secondsX = px(337);
        secondsY = px(132);

        secClipX = px(330);
        secClipY = px(128);
        secClipW = px(60);
        secClipH = px(30);

        burnShift = px(2) > 0 ? px(2) : 1;

        var lhSub = dc.getFontHeight(fontValueSub);
        var lhS = dc.getFontHeight(fontValueS as WatchUi.FontResource);
        var lhXS = dc.getFontHeight(fontValueXS as WatchUi.FontResource);
        var lhM = dc.getFontHeight(fontValueM as WatchUi.FontResource);
        var lhL = dc.getFontHeight(fontValueL as WatchUi.FontResource);

        // Spec section 3.2 ladder (454 canvas). With the custom fonts' tight
        // metrics every block clears the next row; the bottom arc's outer
        // edge (y=376) stays above the steps text top (y=377).
        slots = [
            { :cx => px(94),  :vy => px(98),  :font => fontValueS,  :lh => lhS,   :arc => null },     // hrv
            { :cx => px(360), :vy => px(98),  :font => fontValueS,  :lh => lhS,   :arc => null },     // bat
            { :cx => px(115), :vy => px(318), :font => fontValueSub, :lh => lhSub, :arc => :left },   // bb
            { :cx => px(339), :vy => px(318), :font => fontValueSub, :lh => lhSub, :arc => :right },  // rec
            { :cx => px(227), :vy => px(219), :font => fontValueM,  :lh => lhM,   :arc => null },     // cal
            { :cx => px(186), :vy => px(267), :font => fontValueS,  :lh => lhS,   :arc => null },     // sleep
            { :cx => px(268), :vy => px(267), :font => fontValueS,  :lh => lhS,   :arc => null },     // hr
            { :cx => px(145), :vy => px(309), :font => fontValueXS, :lh => lhXS,  :arc => null },     // int
            { :cx => px(227), :vy => px(309), :font => fontValueXS, :lh => lhXS,  :arc => null },     // next
            { :cx => px(309), :vy => px(309), :font => fontValueXS, :lh => lhXS,  :arc => null },     // sun
            { :cx => px(227), :vy => px(377), :font => fontValueL,  :lh => lhL,   :arc => :bottom }   // steps
        ];

        initialized = true;
    }

    function _computeTicks() as Void {
        var coords = new [60];
        for (var i = 0; i < 60; i++) {
            var angle = (i * 6).toFloat() * Math.PI / 180.0;
            var cosA = Math.cos(angle);
            var sinA = Math.sin(angle);
            var isMajor = (i % 5) == 0;
            var rIn = isMajor ? tickMajorIn : tickMinorIn;
            coords[i] = [
                (cx + rIn * cosA + 0.5).toNumber(),
                (cy + rIn * sinA + 0.5).toNumber(),
                (cx + tickOut * cosA + 0.5).toNumber(),
                (cy + tickOut * sinA + 0.5).toNumber()
            ];
        }
        tickCoords = coords;
    }
}
