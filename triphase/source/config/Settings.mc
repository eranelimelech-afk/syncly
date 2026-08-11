using Toybox.Application.Properties;
using Toybox.Lang;

// Typed settings reader with defaults (spec section 7).
// Values are cached; reload() is called from onSettingsChanged.
// Reads are type-validated: a property that comes back with the wrong type
// (corrupt storage, older app version) falls back to the default instead of
// crashing the draw loop.
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

    function _raw(key as Lang.String) as Lang.Object? {
        var v = null;
        try {
            v = Properties.getValue(key);
        } catch (e) {
            v = null;
        }
        return v;
    }

    function _getNumber(key as Lang.String, def as Lang.Number) as Lang.Number {
        if (_cache.hasKey(key)) {
            return _cache[key] as Lang.Number;
        }
        var v = _raw(key);
        var n = def;
        if (v instanceof Lang.Number) {
            n = v;
        } else if (v instanceof Lang.Float) {
            n = v.toNumber();
        }
        _cache[key] = n;
        return n;
    }

    function _getBoolean(key as Lang.String, def as Lang.Boolean) as Lang.Boolean {
        if (_cache.hasKey(key)) {
            return _cache[key] as Lang.Boolean;
        }
        var v = _raw(key);
        var b = def;
        if (v instanceof Lang.Boolean) {
            b = v;
        }
        _cache[key] = b;
        return b;
    }

    function emphasisMode() as Lang.Number {
        return _getNumber("emphasisMode", MODE_AUTO);
    }

    function morningStart() as Lang.Number {
        return _getNumber("morningStart", 240);
    }

    function dayStart() as Lang.Number {
        return _getNumber("dayStart", 510);
    }

    function eveningStart() as Lang.Number {
        return _getNumber("eveningStart", 1200);
    }

    // Index into Palette.ACCENTS: 0 gold, 1 steel, 2 jade, 3 ember, 4 white.
    function accentColor() as Lang.Number {
        var v = _getNumber("accentColor", 0);
        if (v < 0 || v > 4) {
            return 0;
        }
        return v;
    }

    function showSeconds() as Lang.Boolean {
        return _getBoolean("showSeconds", true);
    }

    function showWeekday() as Lang.Boolean {
        return _getBoolean("showWeekday", true);
    }

    function showTicks() as Lang.Boolean {
        return _getBoolean("showTicks", true);
    }

    function stepGoalOverride() as Lang.Number {
        return _getNumber("stepGoalOverride", 0);
    }

    function aodFields() as Lang.Number {
        return _getNumber("aodFields", AOD_TIME_BB);
    }

    // 0 = dd.MM, 1 = MM.dd
    function dateFormat() as Lang.Number {
        return _getNumber("dateFormat", 0);
    }

    // Metric id assigned to a layout slot (spec section 7: every slot
    // independently reassignable). Defaults mirror the slot order.
    function slotMetric(slotIndex as Lang.Number) as Lang.Number {
        var v = _getNumber(SLOT_KEYS[slotIndex], slotIndex);
        if (v < 0 || v >= Fields.METRIC_COUNT) {
            return slotIndex;
        }
        return v;
    }
}
