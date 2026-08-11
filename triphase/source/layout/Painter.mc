using Toybox.Graphics;
using Toybox.Lang;
using Toybox.System;
using Toybox.WatchUi;

// Visual system (spec section 4).
module Palette {
    const INK = 0x04060A;        // face background, outer
    const WELL = 0x0A0E13;       // sub-dial wells
    const TRACK = 0x191E26;      // arc tracks
    const HAIRLINE = 0x222833;   // sub-dial rims
    const WHITE = 0xFFFFFF;      // lit values
    const DIM_VALUE = 0x767C84;  // unlit values (0.62 emphasis)
    const DIM_LABEL = 0x4A5058;  // unlit labels
    const JADE = 0x4FB39C;       // body battery, hrv, intensity
    const STEEL = 0x7FB3D5;      // sleep, steps
    const GOLD = 0xD2AC58;       // recovery, next event, sun, quarter ticks, seconds
    const EMBER = 0xC4614A;      // calories, heart rate
    const TICK = 0x2B323B;
    const BG_MID = 0x0A0E14;     // faked radial gradient, outer ring
    const BG_CENTER = 0x111820;  // faked radial gradient, center

    // Low-power (0.30 opacity) equivalents, precomputed as solid colors
    // because setColor carries no alpha channel.
    const LP_VALUE = 0x383C42;
    const LP_LABEL = 0x22262B;
    const LP_TRACK = 0x0D1015;

    // Order must match the accentColor settings list: gold/steel/jade/ember/white.
    // (module var, not const: Monkey C consts must be scalar literals)
    var ACCENTS as Toybox.Lang.Array<Toybox.Lang.Number> =
        [GOLD, STEEL, JADE, EMBER, WHITE];
}

// Every pixel drawn by the face goes through this module. Exactly one place
// (drawField) decides lit vs. unlit colors (spec section 6).
module Painter {

    var WEEKDAY_TOKENS as Lang.Array<Lang.String> =
        ["S", "M", "T", "W", "T", "F", "S"];

    function drawFace(dc as Graphics.Dc, lowPower as Lang.Boolean,
            burnIn as Lang.Boolean) as Void {
        var phase = Phase.resolve();
        var accent = Palette.ACCENTS[Config.accentColor()];

        // AMOLED burn-in protection: shift content vertically by a small
        // minute-derived offset while in always-on mode.
        var offsetY = 0;
        if (lowPower && burnIn) {
            offsetY = ((System.getClockTime().min % 3) - 1) * Geom.burnShift;
        }

        dc.setColor(Palette.INK, Palette.INK);
        dc.clear();

        if (!lowPower) {
            _drawBackgroundGlow(dc);
            if (Config.showTicks()) {
                // The tick matching the current second lights up in the
                // accent color (same color as the seconds counter); all
                // other ticks keep their regular unlit color. Tick index 0
                // sits at 3 o'clock and indices advance clockwise, so
                // second s (0 = 12 o'clock) maps to tick (s + 45) % 60.
                var secTick = -1;
                if (Config.showSeconds()) {
                    secTick = (System.getClockTime().sec + 45) % 60;
                }
                _drawTicks(dc, accent, secTick);
            }
            _drawWells(dc);
            _drawDate(dc);
            if (Config.showWeekday()) {
                _drawWeekday(dc, accent);
            }
        }

        _drawTime(dc, offsetY);
        if (!lowPower && Config.showSeconds()) {
            drawSeconds(dc, accent);
        }

        var aodMode = Config.aodFields();
        var slots = Geom.slots as Lang.Array<Lang.Dictionary>;
        for (var i = 0; i < slots.size(); i++) {
            var metricId = Config.slotMetric(i);
            if (lowPower && !_aodAllows(aodMode, metricId)) {
                continue;
            }
            var slot = slots[i];
            var d = Fields.get(metricId);
            var lit = Phase.isLit(metricId, phase);
            _drawField(dc, slot, d, lit, lowPower, offsetY);
            var arc = slot[:arc];
            var frac = d[:frac];
            if (arc instanceof Lang.Symbol && frac instanceof Lang.Float) {
                var color = lit ? d[:color] as Lang.Number : Palette.DIM_VALUE;
                _drawSlotArc(dc, arc, frac, color, lowPower, offsetY);
            }
        }
    }

    function _aodAllows(aodMode as Lang.Number, metricId as Lang.Number) as Lang.Boolean {
        if (aodMode == Config.AOD_TIME_BB) {
            return metricId == Fields.METRIC_BODY_BATTERY;
        }
        if (aodMode == Config.AOD_TIME_BB_STEPS) {
            return metricId == Fields.METRIC_BODY_BATTERY
                || metricId == Fields.METRIC_STEPS;
        }
        if (aodMode == Config.AOD_TIME_BATTERY) {
            return metricId == Fields.METRIC_BATTERY;
        }
        return false; // AOD_TIME_ONLY
    }

    // --- chrome --------------------------------------------------------

    // The spec's radial gradient + carbon cross-hatch, approximated with two
    // concentric fills. A full-screen texture bitmap is explicitly banned by
    // the performance budget (spec section 9).
    function _drawBackgroundGlow(dc as Graphics.Dc) as Void {
        dc.setColor(Palette.BG_MID, Graphics.COLOR_TRANSPARENT);
        dc.fillCircle(Geom.cx, Geom.cy, Geom.px(150));
        dc.setColor(Palette.BG_CENTER, Graphics.COLOR_TRANSPARENT);
        dc.fillCircle(Geom.cx, Geom.cy, Geom.px(95));
    }

    // secondTick: index of the tick lit for the current second (-1 = none).
    // It renders wider than a quarter tick so it reads as lit even when it
    // lands on an already-accented quarter position.
    function _drawTicks(dc as Graphics.Dc, accent as Lang.Number,
            secondTick as Lang.Number) as Void {
        var coords = Geom.tickCoords as Lang.Array;
        for (var i = 0; i < 60; i++) {
            var t = coords[i] as Lang.Array<Lang.Number>;
            if (i == secondTick) {
                // Current second: lit in the seconds-counter accent color.
                dc.setColor(accent, Graphics.COLOR_TRANSPARENT);
                dc.setPenWidth(3);
            } else if (i % 15 == 0) {
                // Quarter ticks (12/3/6/9) carry the accent color.
                dc.setColor(accent, Graphics.COLOR_TRANSPARENT);
                dc.setPenWidth(2);
            } else {
                dc.setColor(Palette.TICK, Graphics.COLOR_TRANSPARENT);
                dc.setPenWidth(1);
            }
            dc.drawLine(t[0], t[1], t[2], t[3]);
        }
        dc.setPenWidth(1);
    }

    function _drawWells(dc as Graphics.Dc) as Void {
        dc.setColor(Palette.WELL, Graphics.COLOR_TRANSPARENT);
        dc.fillCircle(Geom.wellLeftX, Geom.wellY, Geom.wellR);
        dc.fillCircle(Geom.wellRightX, Geom.wellY, Geom.wellR);
        dc.setColor(Palette.HAIRLINE, Graphics.COLOR_TRANSPARENT);
        dc.setPenWidth(1);
        dc.drawCircle(Geom.wellLeftX, Geom.wellY, Geom.wellR);
        dc.drawCircle(Geom.wellRightX, Geom.wellY, Geom.wellR);
    }

    // --- header --------------------------------------------------------

    function _drawDate(dc as Graphics.Dc) as Void {
        dc.setColor(Palette.DIM_VALUE, Graphics.COLOR_TRANSPARENT);
        dc.drawText(Geom.cx, Geom.dateY, Geom.fontDate, Fields.dateString(),
            Graphics.TEXT_JUSTIFY_CENTER);
    }

    function _drawWeekday(dc as Graphics.Dc, accent as Lang.Number) as Void {
        var today = Fields.dayOfWeek(); // 1 = Sunday
        var totalW = Geom.weekdayStep * 7;
        var x = Geom.cx - totalW / 2 + Geom.weekdayStep / 2;
        var fh = dc.getFontHeight(Geom.fontWeekday);
        for (var i = 0; i < 7; i++) {
            if (i == today - 1) {
                // Current day inverted on an accent pill.
                dc.setColor(accent, Graphics.COLOR_TRANSPARENT);
                dc.fillRoundedRectangle(
                    x - Geom.weekdayStep / 2 + 2, Geom.weekdayY - 1,
                    Geom.weekdayStep - 4, fh + 2, 4);
                dc.setColor(Palette.INK, Graphics.COLOR_TRANSPARENT);
            } else {
                dc.setColor(Palette.DIM_LABEL, Graphics.COLOR_TRANSPARENT);
            }
            dc.drawText(x, Geom.weekdayY, Geom.fontWeekday, WEEKDAY_TOKENS[i],
                Graphics.TEXT_JUSTIFY_CENTER);
            x += Geom.weekdayStep;
        }
    }

    // --- time ----------------------------------------------------------

    // The time is never compromised (spec section 14): full size, full white,
    // in both power modes.
    function _drawTime(dc as Graphics.Dc, offsetY as Lang.Number) as Void {
        var clock = System.getClockTime();
        var hour = clock.hour;
        if (!System.getDeviceSettings().is24Hour) {
            hour = hour % 12;
            if (hour == 0) {
                hour = 12;
            }
        }
        var text = hour.format("%02d") + ":" + clock.min.format("%02d");
        dc.setColor(Palette.WHITE, Graphics.COLOR_TRANSPARENT);
        dc.drawText(Geom.cx, Geom.timeY + offsetY, Geom.fontTime, text,
            Graphics.TEXT_JUSTIFY_CENTER);
    }

    function drawSeconds(dc as Graphics.Dc, accent as Lang.Number) as Void {
        dc.setColor(accent, Graphics.COLOR_TRANSPARENT);
        dc.drawText(Geom.secondsX, Geom.secondsY, Geom.fontSeconds,
            System.getClockTime().sec.format("%02d"), Graphics.TEXT_JUSTIFY_LEFT);
    }

    // Clipped seconds redraw for onPartialUpdate (spec section 8: only ever
    // the seconds region, nothing more).
    function drawSecondsPartial(dc as Graphics.Dc) as Void {
        dc.setClip(Geom.secClipX, Geom.secClipY, Geom.secClipW, Geom.secClipH);
        dc.setColor(Palette.INK, Palette.INK);
        dc.fillRectangle(Geom.secClipX, Geom.secClipY, Geom.secClipW, Geom.secClipH);
        drawSeconds(dc, Palette.ACCENTS[Config.accentColor()]);
        dc.clearClip();
    }

    // --- fields --------------------------------------------------------

    // The single place that decides lit vs. unlit colors (spec section 6).
    // Color rule (spec section 4): the label carries its category color only
    // when the field is lit; unlit, both value and label go gray.
    function _drawField(dc as Graphics.Dc, slot as Lang.Dictionary,
            d as Lang.Dictionary, lit as Lang.Boolean, lowPower as Lang.Boolean,
            offsetY as Lang.Number) as Void {
        var vColor;
        var lColor;
        if (lit) {
            vColor = Palette.WHITE;
            lColor = d[:color] as Lang.Number;
        } else if (lowPower) {
            vColor = Palette.LP_VALUE;
            lColor = Palette.LP_LABEL;
        } else {
            vColor = Palette.DIM_VALUE;
            lColor = Palette.DIM_LABEL;
        }
        var x = slot[:cx] as Lang.Number;
        var vy = (slot[:vy] as Lang.Number) + offsetY;
        var font = slot[:font] as Graphics.FontDefinition;
        dc.setColor(vColor, Graphics.COLOR_TRANSPARENT);
        dc.drawText(x, vy, font, d[:value] as Lang.String,
            Graphics.TEXT_JUSTIFY_CENTER);
        dc.setColor(lColor, Graphics.COLOR_TRANSPARENT);
        dc.drawText(x, vy + (slot[:lh] as Lang.Number), Geom.fontLabel,
            d[:label] as Lang.String, Graphics.TEXT_JUSTIFY_CENTER);
    }

    // --- arcs ----------------------------------------------------------

    function _drawSlotArc(dc as Graphics.Dc, which as Lang.Symbol,
            frac as Lang.Float, color as Lang.Number, lowPower as Lang.Boolean,
            offsetY as Lang.Number) as Void {
        var track = lowPower ? Palette.LP_TRACK : Palette.TRACK;
        if (which == :left) {
            _drawRingArc(dc, Geom.wellLeftX, Geom.wellY + offsetY, Geom.subArcR,
                Geom.subArcW, frac, color, track);
        } else if (which == :right) {
            _drawRingArc(dc, Geom.wellRightX, Geom.wellY + offsetY, Geom.subArcR,
                Geom.subArcW, frac, color, track);
        } else if (which == :bottom) {
            _drawBottomArc(dc, frac, color, track, offsetY);
        }
    }

    // Full-circle gauge starting at 12 o'clock, filling clockwise.
    // Garmin arc angles: 0 at 3 o'clock, increasing counterclockwise.
    function _drawRingArc(dc as Graphics.Dc, x as Lang.Number, y as Lang.Number,
            r as Lang.Number, penW as Lang.Number, frac as Lang.Float,
            color as Lang.Number, trackColor as Lang.Number) as Void {
        dc.setPenWidth(penW);
        dc.setColor(trackColor, Graphics.COLOR_TRANSPARENT);
        dc.drawArc(x, y, r, Graphics.ARC_CLOCKWISE, 90, 270);
        dc.drawArc(x, y, r, Graphics.ARC_CLOCKWISE, 270, 90);
        if (frac > 0.003) {
            dc.setColor(color, Graphics.COLOR_TRANSPARENT);
            if (frac >= 0.997) {
                dc.drawArc(x, y, r, Graphics.ARC_CLOCKWISE, 90, 270);
                dc.drawArc(x, y, r, Graphics.ARC_CLOCKWISE, 270, 90);
            } else {
                var endDeg = (90 - (360.0 * frac).toNumber() + 360) % 360;
                dc.drawArc(x, y, r, Graphics.ARC_CLOCKWISE, 90, endDeg);
            }
        }
        dc.setPenWidth(1);
    }

    // Steps arc: 60 degrees centered on 6 o'clock (240..300 in Garmin angles),
    // filling viewer-left to viewer-right. Its lowest point is cy + r; the
    // sweep must never extend past 60 degrees or it collides with the steps
    // digits below it (spec section 3.3).
    function _drawBottomArc(dc as Graphics.Dc, frac as Lang.Float,
            color as Lang.Number, trackColor as Lang.Number,
            offsetY as Lang.Number) as Void {
        var y = Geom.cy + offsetY;
        dc.setPenWidth(Geom.bottomArcW);
        dc.setColor(trackColor, Graphics.COLOR_TRANSPARENT);
        dc.drawArc(Geom.cx, y, Geom.bottomArcR, Graphics.ARC_COUNTER_CLOCKWISE, 240, 300);
        var endDeg = 240 + (60.0 * frac).toNumber();
        if (endDeg > 300) {
            endDeg = 300;
        }
        // endDeg must strictly exceed the start angle: drawArc with equal
        // angles is degenerate and can render a full circle on some firmware.
        if (endDeg > 240) {
            dc.setColor(color, Graphics.COLOR_TRANSPARENT);
            dc.drawArc(Geom.cx, y, Geom.bottomArcR, Graphics.ARC_COUNTER_CLOCKWISE, 240, endDeg);
        }
        dc.setPenWidth(1);
    }
}
