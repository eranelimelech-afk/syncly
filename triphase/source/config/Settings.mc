using Toybox.Application.Properties;
using Toybox.Lang;

// Typed settings reader with defaults (spec section 7).
// Values are cached; reload() is called from onSettingsChanged.
module Config {

    const MODE_AUTO = 0;
    const MODE_MORNING = 1;
    const MODE_DAY = 2;
    const MODE_EVENING = 3;
    const MODE_FLAT = 4;

    const AOD_TIME_ONLY = 0;
    const AOD_TIME_BB = 1;
    const AOD_TIME_BB_STEPS = 2;
    const AOD_TIME_BATTERY = 3;

    // Slot order is the canonical field order used everywhere:
    // hrv, bat, bb, rec, cal, sleep, hr, int, next, sun, steps
    // (module var, not const: Monkey C consts must be scalar literals)
    var SLOT_KEYS as Lang.Array<Lang.String> = [
        "field_hrv", "field_bat", "field_bb", "field_rec", "field_cal",
        "field_sleep", "field_hr", "field_int", "field_next", "field_sun",
        "field_steps"
    ];

    var _cache as Lang.Dictionary = {};

    function reload() as Void {
        _cache = {};
        $.Phase.invalidate();
    }

    function _get(key, def) {
        if (_cache.hasKey(key)) {
            return _cache[key];
        }
        var v = null;
        try {
            v = Properties.getValue(key);
        } catch (e) {
            v = null;
        }
        if (v == null) {
            v = def;
        }
        _cache[key] = v;
        return v;
    }

    function emphasisMode() {
        return _get("emphasisMode", MODE_AUTO);
    }

    function morningStart() {
        return _get("morningStart", 240);
    }

    function dayStart() {
        return _get("dayStart", 510);
    }

    function eveningStart() {
        return _get("eveningStart", 1200);
    }

    // Index into Palette.ACCENTS: 0 gold, 1 steel, 2 jade, 3 ember, 4 white.
    function accentColor() {
        var v = _get("accentColor", 0);
        if (v < 0 || v > 4) {
            return 0;
        }
        return v;
    }

    function showSeconds() {
        return _get("showSeconds", true);
    }

    function showWeekday() {
        return _get("showWeekday", true);
    }

    function showTicks() {
        return _get("showTicks", true);
    }

    function stepGoalOverride() {
        return _get("stepGoalOverride", 0);
    }

    function aodFields() {
        return _get("aodFields", AOD_TIME_BB);
    }

    // 0 = dd.MM, 1 = MM.dd
    function dateFormat() {
        return _get("dateFormat", 0);
    }

    // Metric id assigned to a layout slot (spec section 7: every slot
    // independently reassignable). Defaults mirror the slot order.
    function slotMetric(slotIndex) {
        var v = _get(SLOT_KEYS[slotIndex], slotIndex);
        if (v < 0 || v >= Fields.METRIC_COUNT) {
            return slotIndex;
        }
        return v;
    }
}
