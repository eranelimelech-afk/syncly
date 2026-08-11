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

    var initialized as Lang.Boolean = false;

    var w as Lang.Number = 454;
    var h as Lang.Number = 454;
    var cx as Lang.Number = 227;
    var cy as Lang.Number = 227;
    var s as Lang.Float = 1.0;

    // Fonts by role
    var fontTime as Graphics.FontDefinition = Graphics.FONT_NUMBER_THAI_HOT;
    var fontSeconds as Graphics.FontDefinition = Graphics.FONT_TINY;
    var fontValueL as Graphics.FontDefinition = Graphics.FONT_MEDIUM;  // ~32px: steps
    var fontValueM as Graphics.FontDefinition = Graphics.FONT_SMALL;   // ~28-29px: calories, sub-dials
    var fontValueS as Graphics.FontDefinition = Graphics.FONT_TINY;    // ~21-22px: everything else
    var fontLabel as Graphics.FontDefinition = Graphics.FONT_XTINY;    // labels
    var fontDate as Graphics.FontDefinition = Graphics.FONT_XTINY;
    var fontWeekday as Graphics.FontDefinition = Graphics.FONT_XTINY;

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

    // Text anchor rows (y = top of text block, x = center of block)
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
