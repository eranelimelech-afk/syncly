using Toybox.Graphics;
using Toybox.Lang;
using Toybox.Math;

// All layout coordinates live here (spec section 11: no magic numbers in the
// painter). The reference canvas is 454x454 with center (227,227); everything
// is derived from dc dimensions via a scale factor so the layout survives a
// device with a different resolution.
//
// Fonts: the spec calls for custom bitmap fonts (Barlow Semi Condensed,
// tabular figures). Until those .fnt files are generated with the SDK font
// tools, the nearest built-in fonts are used; the slot descriptors carry the
// font so swapping in custom fonts is a one-line change per size. This is
// tracked as an open item in the project README.
module Geom {

    const REF = 454.0;

    var initialized = false;

    var w = 454;
    var h = 454;
    var cx = 227;
    var cy = 227;
    var s = 1.0;

    // Fonts by role
    var fontTime;
    var fontSeconds;
    var fontValueL;   // ~32px: steps
    var fontValueM;   // ~28-29px: calories, sub-dials
    var fontValueS;   // ~21-22px: everything else
    var fontLabel;    // ~11px labels
    var fontDate;
    var fontWeekday;

    // Chrome geometry
    var tickMinorIn;
    var tickMajorIn;
    var tickOut;
    // Precomputed tick line endpoints: [x1, y1, x2, y2] * 60, computed once
    // in init so the draw loop does no trig (spec section 9).
    var tickCoords as Lang.Array? = null;

    var wellR;
    var wellLeftX;
    var wellRightX;
    var wellY;
    var subArcR;
    var subArcW;

    var bottomArcR;
    var bottomArcW;

    // Text anchor rows (y = top of text block, x = center of block)
    var dateY;
    var weekdayY;
    var weekdayStep;
    var timeY;
    var secondsX;
    var secondsY;

    // Seconds clip region for onPartialUpdate
    var secClipX;
    var secClipY;
    var secClipW;
    var secClipH;

    // Burn-in shift amplitude
    var burnShift;

    // Slot descriptors, in Config.SLOT_KEYS order:
    // hrv, bat, bb, rec, cal, sleep, hr, int, next, sun, steps
    // Each: { :cx, :vy, :font, :lh (label y offset), :arc (:left/:right/:bottom/null) }
    var slots as Lang.Array<Lang.Dictionary>? = null;

    function px(v) {
        return (v * s + 0.5).toNumber();
    }

    function init(dc) {
        w = dc.getWidth();
        h = dc.getHeight();
        cx = w / 2;
        cy = h / 2;
        s = w / REF;

        fontTime = Graphics.FONT_NUMBER_THAI_HOT;
        fontSeconds = Graphics.FONT_TINY;
        fontValueL = Graphics.FONT_MEDIUM;
        fontValueM = Graphics.FONT_SMALL;
        fontValueS = Graphics.FONT_TINY;
        fontLabel = Graphics.FONT_XTINY;
        fontDate = Graphics.FONT_XTINY;
        fontWeekday = Graphics.FONT_XTINY;

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

        dateY = px(30);
        weekdayY = px(58);
        weekdayStep = px(27);
        timeY = px(118);
        secondsX = px(340);
        secondsY = px(132);

        secClipX = px(330);
        secClipY = px(126);
        secClipW = px(70);
        secClipH = px(40);

        burnShift = px(2) > 0 ? px(2) : 1;

        var lhS = dc.getFontHeight(fontValueS);
        var lhM = dc.getFontHeight(fontValueM);
        var lhL = dc.getFontHeight(fontValueL);

        slots = [
            { :cx => px(94),  :vy => px(92),  :font => fontValueS, :lh => lhS, :arc => null },     // hrv
            { :cx => px(360), :vy => px(92),  :font => fontValueS, :lh => lhS, :arc => null },     // bat
            { :cx => px(115), :vy => px(318), :font => fontValueM, :lh => lhM, :arc => :left },    // bb
            { :cx => px(339), :vy => px(318), :font => fontValueM, :lh => lhM, :arc => :right },   // rec
            { :cx => px(227), :vy => px(214), :font => fontValueM, :lh => lhM, :arc => null },     // cal
            { :cx => px(186), :vy => px(262), :font => fontValueS, :lh => lhS, :arc => null },     // sleep
            { :cx => px(268), :vy => px(262), :font => fontValueS, :lh => lhS, :arc => null },     // hr
            { :cx => px(145), :vy => px(304), :font => fontValueS, :lh => lhS, :arc => null },     // int
            { :cx => px(227), :vy => px(304), :font => fontValueS, :lh => lhS, :arc => null },     // next
            { :cx => px(309), :vy => px(304), :font => fontValueS, :lh => lhS, :arc => null },     // sun
            { :cx => px(227), :vy => px(377), :font => fontValueL, :lh => lhL, :arc => :bottom }   // steps
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
