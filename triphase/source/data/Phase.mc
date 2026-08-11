using Toybox.Lang;
using Toybox.System;

// Emphasis engine (spec section 6).
// resolve() maps the current local time + settings to a phase; the result is
// cached per minute so field lit-state is not recomputed per field per draw.
module Phase {

    const MORNING = 0;
    const DAY = 1;
    const EVENING = 2;
    const FLAT = 3;

    // Lit sets are keyed by METRIC id, not by slot, so reassigning a slot
    // keeps the emphasis semantics attached to the metric itself.
    // (module vars, not consts: Monkey C consts must be scalar literals)
    var LIT_MORNING as Lang.Array<Lang.Number> = [
        Fields.METRIC_BODY_BATTERY, Fields.METRIC_RECOVERY,
        Fields.METRIC_SLEEP, Fields.METRIC_HRV, Fields.METRIC_STRESS
    ];
    var LIT_DAY as Lang.Array<Lang.Number> = [
        Fields.METRIC_CALORIES, Fields.METRIC_HEART_RATE,
        Fields.METRIC_INTENSITY, Fields.METRIC_STEPS
    ];
    var LIT_EVENING as Lang.Array<Lang.Number> = [
        Fields.METRIC_BODY_BATTERY, Fields.METRIC_NEXT_EVENT,
        Fields.METRIC_STEPS, Fields.METRIC_BATTERY
    ];

    var _cachedMinute as Lang.Number = -1;
    var _cachedPhase as Lang.Number = FLAT;

    function invalidate() as Void {
        _cachedMinute = -1;
    }

    function resolve() as Lang.Number {
        var clock = System.getClockTime();
        var minuteOfDay = clock.hour * 60 + clock.min;
        if (minuteOfDay == _cachedMinute) {
            return _cachedPhase;
        }
        _cachedMinute = minuteOfDay;

        var mode = Config.emphasisMode();
        if (mode == Config.MODE_FLAT) {
            _cachedPhase = FLAT;
        } else if (mode == Config.MODE_MORNING) {
            _cachedPhase = MORNING;
        } else if (mode == Config.MODE_DAY) {
            _cachedPhase = DAY;
        } else if (mode == Config.MODE_EVENING) {
            _cachedPhase = EVENING;
        } else {
            _cachedPhase = _resolveAuto(minuteOfDay);
        }
        return _cachedPhase;
    }

    function _resolveAuto(m as Lang.Number) as Lang.Number {
        var morningStart = Config.morningStart();
        var dayStart = Config.dayStart();
        var eveningStart = Config.eveningStart();
        if (_inWindow(m, morningStart, dayStart)) {
            return MORNING;
        }
        if (_inWindow(m, dayStart, eveningStart)) {
            return DAY;
        }
        return EVENING;
    }

    // Windows may wrap past midnight (e.g. 20:00 -> 04:00), so a window whose
    // start is after its end is tested as a wrap, not a simple range.
    function _inWindow(m as Lang.Number, start as Lang.Number,
            end as Lang.Number) as Lang.Boolean {
        if (start <= end) {
            return m >= start && m < end;
        }
        return m >= start || m < end;
    }

    function isLit(metricId as Lang.Number, phase as Lang.Number) as Lang.Boolean {
        if (phase == FLAT) {
            return true;
        }
        var set;
        if (phase == MORNING) {
            set = LIT_MORNING;
        } else if (phase == DAY) {
            set = LIT_DAY;
        } else {
            set = LIT_EVENING;
        }
        return set.indexOf(metricId) >= 0;
    }
}
