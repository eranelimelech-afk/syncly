using Toybox.Activity;
using Toybox.ActivityMonitor;
using Toybox.Lang;
using Toybox.System;
using Toybox.Time;
using Toybox.Time.Gregorian;
using Toybox.WatchUi;

// Field descriptors + accessor chain (spec section 5).
// Every accessor has a documented fallback chain; when the whole chain
// returns null the field renders "--". Stale values are never shown as live.
//
// HRV status has no documented watch-face API (spec "Verify first" row), so
// METRIC_HRV is implemented as the sanctioned substitution: Stress from
// SensorHistory, labeled STRESS on screen. If a future SDK exposes HRV
// status, wire it in here without layout changes.
module Fields {

    const METRIC_HRV = 0;
    const METRIC_BATTERY = 1;
    const METRIC_BODY_BATTERY = 2;
    const METRIC_RECOVERY = 3;
    const METRIC_CALORIES = 4;
    const METRIC_SLEEP = 5;
    const METRIC_HEART_RATE = 6;
    const METRIC_INTENSITY = 7;
    const METRIC_NEXT_EVENT = 8;
    const METRIC_SUN = 9;
    const METRIC_STEPS = 10;
    const METRIC_STRESS = 11;
    const METRIC_COUNT = 12;

    const NO_VALUE = "--";

    // Latest complication values, keyed by complication type constant.
    // Filled by TriPhaseApp.onComplicationChanged; read-only elsewhere.
    var _complicationValues as Lang.Dictionary = {};
    // Complication type constants resolved once (guarded by `has`), keyed by
    // a stable local symbol so accessors don't repeat the guards.
    var _compTypes as Lang.Dictionary = {};

    var _labels as Lang.Array? = null;
    var _colors as Lang.Array? = null;
    var _sunsetLabel as Lang.String = "";
    var _weekPrefix as Lang.String = "";

    function subscribeComplications() as Void {
        var comp = Toybox.Complications;
        if (comp has :COMPLICATION_TYPE_BODY_BATTERY) {
            _compTypes[:bodyBattery] = comp.COMPLICATION_TYPE_BODY_BATTERY;
        }
        if (comp has :COMPLICATION_TYPE_RECOVERY_TIME) {
            _compTypes[:recovery] = comp.COMPLICATION_TYPE_RECOVERY_TIME;
        }
        if (comp has :COMPLICATION_TYPE_SLEEP_SCORE) {
            _compTypes[:sleepScore] = comp.COMPLICATION_TYPE_SLEEP_SCORE;
        }
        if (comp has :COMPLICATION_TYPE_CALENDAR_EVENTS) {
            _compTypes[:calendar] = comp.COMPLICATION_TYPE_CALENDAR_EVENTS;
        }
        if (comp has :COMPLICATION_TYPE_STRESS) {
            _compTypes[:stress] = comp.COMPLICATION_TYPE_STRESS;
        }
        var keys = _compTypes.keys();
        for (var i = 0; i < keys.size(); i++) {
            var type = _compTypes[keys[i]] as Toybox.Complications.Type;
            try {
                var c = Toybox.Complications.getComplication(
                    new Toybox.Complications.Id(type));
                if (c != null) {
                    _complicationValues[type] = c.value;
                }
                Toybox.Complications.subscribeToUpdates(
                    new Toybox.Complications.Id(type));
            } catch (e) {
                // Type not offered on this device; the accessor chain falls
                // through to NO_VALUE.
            }
        }
    }

    function storeComplication(type as Toybox.Complications.Type,
            value as Lang.Object?) as Void {
        _complicationValues[type] = value;
    }

    function _complicationValue(key as Lang.Symbol) as Lang.Object? {
        if (_compTypes.hasKey(key)) {
            var type = _compTypes[key] as Toybox.Complications.Type;
            if (_complicationValues.hasKey(type)) {
                return _complicationValues[type] as Lang.Object?;
            }
        }
        return null;
    }

    function _initStrings() as Void {
        var labels = new [METRIC_COUNT];
        labels[METRIC_HRV] = WatchUi.loadResource(Rez.Strings.LabelHrv);
        labels[METRIC_BATTERY] = WatchUi.loadResource(Rez.Strings.LabelBattery);
        labels[METRIC_BODY_BATTERY] = WatchUi.loadResource(Rez.Strings.LabelBodyBattery);
        labels[METRIC_RECOVERY] = WatchUi.loadResource(Rez.Strings.LabelRecovery);
        labels[METRIC_CALORIES] = WatchUi.loadResource(Rez.Strings.LabelCalories);
        labels[METRIC_SLEEP] = WatchUi.loadResource(Rez.Strings.LabelSleep);
        labels[METRIC_HEART_RATE] = WatchUi.loadResource(Rez.Strings.LabelHeartRate);
        labels[METRIC_INTENSITY] = WatchUi.loadResource(Rez.Strings.LabelIntensity);
        labels[METRIC_NEXT_EVENT] = WatchUi.loadResource(Rez.Strings.LabelNextEvent);
        labels[METRIC_SUN] = WatchUi.loadResource(Rez.Strings.LabelSunrise);
        labels[METRIC_STEPS] = WatchUi.loadResource(Rez.Strings.LabelSteps);
        labels[METRIC_STRESS] = WatchUi.loadResource(Rez.Strings.LabelStress);
        _labels = labels;
        _sunsetLabel = WatchUi.loadResource(Rez.Strings.LabelSunset) as Lang.String;
        _weekPrefix = WatchUi.loadResource(Rez.Strings.WeekPrefix) as Lang.String;

        var colors = new [METRIC_COUNT];
        colors[METRIC_HRV] = Palette.JADE;
        colors[METRIC_BATTERY] = Palette.GOLD;
        colors[METRIC_BODY_BATTERY] = Palette.JADE;
        colors[METRIC_RECOVERY] = Palette.GOLD;
        colors[METRIC_CALORIES] = Palette.EMBER;
        colors[METRIC_SLEEP] = Palette.STEEL;
        colors[METRIC_HEART_RATE] = Palette.EMBER;
        colors[METRIC_INTENSITY] = Palette.JADE;
        colors[METRIC_NEXT_EVENT] = Palette.GOLD;
        colors[METRIC_SUN] = Palette.GOLD;
        colors[METRIC_STEPS] = Palette.STEEL;
        colors[METRIC_STRESS] = Palette.JADE;
        _colors = colors;
    }

    // Returns { :value, :label, :color, :frac } for a metric.
    // :frac is a 0..1 Float for arc-backed metrics, else null.
    function get(metricId as Lang.Number) as Lang.Dictionary {
        if (_labels == null) {
            _initStrings();
        }
        var labels = _labels as Lang.Array;
        var colors = _colors as Lang.Array;
        var value = null as Lang.String?;
        var frac = null as Lang.Float?;
        var label = labels[metricId] as Lang.String;

        if (metricId == METRIC_HRV || metricId == METRIC_STRESS) {
            value = _stressValue();
            // The HRV slot currently renders the Stress proxy, so it must
            // say so on screen ("never render a stale value without
            // indication"). When a real HRV source lands, restore the HRV
            // label alongside it.
            label = labels[METRIC_STRESS] as Lang.String;
        } else if (metricId == METRIC_BATTERY) {
            var stats = System.getSystemStats();
            if (stats != null && stats.battery != null) {
                value = stats.battery.toNumber().format("%d") + "%";
                frac = stats.battery / 100.0;
            }
        } else if (metricId == METRIC_BODY_BATTERY) {
            var bb = _bodyBattery();
            if (bb != null) {
                value = bb.format("%d");
                frac = bb / 100.0;
            }
        } else if (metricId == METRIC_RECOVERY) {
            var hours = _recoveryHours();
            if (hours != null) {
                value = hours.format("%d") + "h";
                // Fraction of 24h remaining, inverted: the arc fills as
                // recovery completes (spec section 3.3).
                frac = 1.0 - (hours / 24.0);
                if (frac < 0.0) {
                    frac = 0.0;
                }
            }
        } else if (metricId == METRIC_CALORIES) {
            var info = ActivityMonitor.getInfo();
            if (info != null) {
                var cal = info.calories;
                if (cal != null) {
                    value = cal.format("%d");
                }
            }
        } else if (metricId == METRIC_SLEEP) {
            var score = _complicationValue(:sleepScore);
            if (score instanceof Lang.Number) {
                value = score.format("%d");
            } else if (score instanceof Lang.Float) {
                value = score.toNumber().format("%d");
            }
        } else if (metricId == METRIC_HEART_RATE) {
            value = _heartRate();
        } else if (metricId == METRIC_INTENSITY) {
            var info = ActivityMonitor.getInfo();
            if (info != null) {
                var aw = info.activeMinutesWeek;
                if (aw != null) {
                    value = aw.total.format("%d");
                }
            }
        } else if (metricId == METRIC_NEXT_EVENT) {
            value = _nextEvent();
        } else if (metricId == METRIC_SUN) {
            var sun = _sun();
            if (sun != null) {
                value = sun[0] as Lang.String;
                label = sun[1] as Lang.String;
            }
        } else if (metricId == METRIC_STEPS) {
            var info = ActivityMonitor.getInfo();
            if (info != null) {
                var steps = info.steps;
                if (steps != null) {
                    value = steps.format("%d");
                    var goal = Config.stepGoalOverride();
                    var deviceGoal = info.stepGoal;
                    if (goal <= 0 && deviceGoal != null) {
                        goal = deviceGoal;
                    }
                    if (goal > 0) {
                        frac = steps.toFloat() / goal;
                        if (frac > 1.0) {
                            frac = 1.0;
                        }
                    }
                }
            }
        }

        if (value == null) {
            value = NO_VALUE;
        }
        return {
            :value => value,
            :label => label,
            :color => colors[metricId],
            :frac => frac
        };
    }

    // --- accessors -----------------------------------------------------

    // Primary: live activity info. Fallback: newest heart-rate history sample.
    function _heartRate() as Lang.String? {
        var info = Activity.getActivityInfo();
        if (info != null) {
            var hr = info.currentHeartRate;
            if (hr != null) {
                return hr.format("%d");
            }
        }
        if (ActivityMonitor has :getHeartRateHistory) {
            var it = ActivityMonitor.getHeartRateHistory(1, true);
            if (it != null) {
                var sample = it.next();
                if (sample != null) {
                    var hr = sample.heartRate;
                    if (hr != null && hr != ActivityMonitor.INVALID_HR_SAMPLE) {
                        return hr.format("%d");
                    }
                }
            }
        }
        return null;
    }

    // Primary: SensorHistory. Fallback: Body Battery complication.
    function _bodyBattery() as Lang.Number? {
        var v = _latestSensorSample(:getBodyBatteryHistory);
        if (v != null) {
            return v;
        }
        var cv = _complicationValue(:bodyBattery);
        if (cv instanceof Lang.Number) {
            return cv;
        }
        if (cv instanceof Lang.Float) {
            return cv.toNumber();
        }
        return null;
    }

    // Stress stands in for HRV status (spec section 5 substitution).
    // Verified against SDK 9.2.0 (June 2026): the API exposes no HRV to
    // watch faces at all - no complication type, no SensorHistory series
    // (the only "HRV" symbol in the entire API is LANGUAGE_HRV, Croatian).
    // Chain: SensorHistory stress -> Stress complication -> "--".
    function _stressValue() as Lang.String? {
        var v = _latestSensorSample(:getStressHistory);
        if (v != null) {
            return v.format("%d");
        }
        var cv = _complicationValue(:stress);
        if (cv instanceof Lang.Number) {
            return cv.format("%d");
        }
        if (cv instanceof Lang.Float) {
            return cv.toNumber().format("%d");
        }
        return null;
    }

    function _latestSensorSample(historySymbol as Lang.Symbol) as Lang.Number? {
        if (!(Toybox has :SensorHistory)) {
            return null;
        }
        var it = null;
        if (historySymbol == :getBodyBatteryHistory) {
            if (Toybox.SensorHistory has :getBodyBatteryHistory) {
                it = Toybox.SensorHistory.getBodyBatteryHistory(
                    {:period => 1, :order => Toybox.SensorHistory.ORDER_NEWEST_FIRST});
            }
        } else if (historySymbol == :getStressHistory) {
            if (Toybox.SensorHistory has :getStressHistory) {
                it = Toybox.SensorHistory.getStressHistory(
                    {:period => 1, :order => Toybox.SensorHistory.ORDER_NEWEST_FIRST});
            }
        }
        if (it != null) {
            var sample = it.next();
            if (sample != null) {
                var data = sample.data;
                if (data != null) {
                    return data.toNumber();
                }
            }
        }
        return null;
    }

    // Primary: ActivityMonitor timeToRecovery (hours, `has`-guarded).
    // Fallback: Recovery Time complication, which reports seconds.
    function _recoveryHours() as Lang.Number? {
        var info = ActivityMonitor.getInfo();
        if (info != null && (info has :timeToRecovery)) {
            var ttr = info.timeToRecovery;
            if (ttr != null) {
                return ttr;
            }
        }
        var v = _complicationValue(:recovery);
        if (v instanceof Lang.Number) {
            return (v / 60) / 60;
        }
        return null;
    }

    // Next event is not natively exposed to watch faces (spec "Workaround"
    // row): use the calendar-events complication when the device offers it.
    function _nextEvent() as Lang.String? {
        var v = _complicationValue(:calendar);
        if (v instanceof Lang.String && v.length() > 0) {
            return v;
        }
        if (v instanceof Lang.Number) {
            return v.format("%d");
        }
        return null;
    }

    // Primary: Weather sunrise/sunset for the last known position.
    // Returns [formatted time, RISE/SET label] for the next sun event.
    function _sun() as Lang.Array? {
        if (!(Toybox has :Weather)) {
            return null;
        }
        if (!((Toybox.Weather has :getSunrise) && (Toybox.Weather has :getSunset))) {
            return null;
        }
        var cc = Toybox.Weather.getCurrentConditions();
        if (cc == null) {
            return null;
        }
        var pos = cc.observationLocationPosition;
        if (pos == null) {
            return null;
        }
        var now = Time.now();
        var riseLabel = (_labels as Lang.Array)[METRIC_SUN] as Lang.String;
        var sunrise = Toybox.Weather.getSunrise(pos, now);
        var sunset = Toybox.Weather.getSunset(pos, now);
        if (sunrise != null && now.lessThan(sunrise)) {
            return [_formatMoment(sunrise), riseLabel];
        }
        if (sunset != null && now.lessThan(sunset)) {
            return [_formatMoment(sunset), _sunsetLabel];
        }
        var tomorrow = now.add(new Time.Duration(Gregorian.SECONDS_PER_DAY));
        var nextRise = Toybox.Weather.getSunrise(pos, tomorrow);
        if (nextRise != null) {
            return [_formatMoment(nextRise), riseLabel];
        }
        return null;
    }

    function _formatMoment(moment as Time.Moment) as Lang.String {
        var info = Gregorian.info(moment, Time.FORMAT_SHORT);
        return info.hour.format("%02d") + ":" + info.min.format("%02d");
    }

    // --- date helpers (used by the painter) ----------------------------

    // "11.08 · WEEK 33" per spec section 3.2. Week number is day-of-year
    // based (approximation documented in the project README).
    function dateString() as Lang.String {
        if (_labels == null) {
            _initStrings();
        }
        var info = Gregorian.info(Time.now(), Time.FORMAT_SHORT);
        var month = info.month as Lang.Number;
        var doy = _dayOfYear(info.year, month, info.day);
        var week = ((doy - 1) / 7) + 1;
        var d = info.day.format("%02d");
        var m = month.format("%02d");
        var datePart = (Config.dateFormat() == 0) ? (d + "." + m) : (m + "." + d);
        return datePart + " " + _weekPrefix + " " + week.format("%d");
    }

    // 1 = Sunday ... 7 = Saturday
    function dayOfWeek() as Lang.Number {
        var info = Gregorian.info(Time.now(), Time.FORMAT_SHORT);
        return info.day_of_week as Lang.Number;
    }

    function _dayOfYear(year as Lang.Number, month as Lang.Number,
            day as Lang.Number) as Lang.Number {
        var cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        var doy = cum[month - 1] + day;
        if (month > 2 && ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0)) {
            doy++;
        }
        return doy;
    }
}
