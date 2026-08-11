using Toybox.Activity;
using Toybox.ActivityMonitor;
using Toybox.System;
using Toybox.Time;
using Toybox.Time.Gregorian;
using Toybox.WatchUi;
using Toybox.Lang;

// Field descriptors + accessor chain (spec section 5).
// Every accessor has a documented fallback chain; when the whole chain
// returns null the field renders "--". Stale values are never shown as live.
//
// HRV status has no documented watch-face API (spec "Verify first" row), so
// METRIC_HRV is implemented as the sanctioned substitution: Stress from
// SensorHistory. If a future SDK exposes HRV status as a complication it
// slots into _hrvValue() without layout changes.
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
    var _sunsetLabel = null;
    var _weekPrefix = null;

    function subscribeComplications() {
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
        var keys = _compTypes.keys();
        for (var i = 0; i < keys.size(); i++) {
            var type = _compTypes[keys[i]];
            try {
                var c = comp.getComplication(new Toybox.Complications.Id(type));
                if (c != null) {
                    _complicationValues[type] = c.value;
                }
                comp.subscribeToUpdates(new Toybox.Complications.Id(type));
            } catch (e) {
                // Type not offered on this device; the accessor chain falls
                // through to NO_VALUE.
            }
        }
    }

    function storeComplication(type, value) {
        _complicationValues[type] = value;
    }

    function _complicationValue(key) {
        if (_compTypes.hasKey(key)) {
            var type = _compTypes[key];
            if (_complicationValues.hasKey(type)) {
                return _complicationValues[type];
            }
        }
        return null;
    }

    function _initStrings() {
        _labels = new [METRIC_COUNT];
        _labels[METRIC_HRV] = WatchUi.loadResource(Rez.Strings.LabelHrv);
        _labels[METRIC_BATTERY] = WatchUi.loadResource(Rez.Strings.LabelBattery);
        _labels[METRIC_BODY_BATTERY] = WatchUi.loadResource(Rez.Strings.LabelBodyBattery);
        _labels[METRIC_RECOVERY] = WatchUi.loadResource(Rez.Strings.LabelRecovery);
        _labels[METRIC_CALORIES] = WatchUi.loadResource(Rez.Strings.LabelCalories);
        _labels[METRIC_SLEEP] = WatchUi.loadResource(Rez.Strings.LabelSleep);
        _labels[METRIC_HEART_RATE] = WatchUi.loadResource(Rez.Strings.LabelHeartRate);
        _labels[METRIC_INTENSITY] = WatchUi.loadResource(Rez.Strings.LabelIntensity);
        _labels[METRIC_NEXT_EVENT] = WatchUi.loadResource(Rez.Strings.LabelNextEvent);
        _labels[METRIC_SUN] = WatchUi.loadResource(Rez.Strings.LabelSunrise);
        _labels[METRIC_STEPS] = WatchUi.loadResource(Rez.Strings.LabelSteps);
        _labels[METRIC_STRESS] = WatchUi.loadResource(Rez.Strings.LabelStress);
        _sunsetLabel = WatchUi.loadResource(Rez.Strings.LabelSunset);
        _weekPrefix = WatchUi.loadResource(Rez.Strings.WeekPrefix);

        _colors = new [METRIC_COUNT];
        _colors[METRIC_HRV] = Palette.JADE;
        _colors[METRIC_BATTERY] = Palette.GOLD;
        _colors[METRIC_BODY_BATTERY] = Palette.JADE;
        _colors[METRIC_RECOVERY] = Palette.GOLD;
        _colors[METRIC_CALORIES] = Palette.EMBER;
        _colors[METRIC_SLEEP] = Palette.STEEL;
        _colors[METRIC_HEART_RATE] = Palette.EMBER;
        _colors[METRIC_INTENSITY] = Palette.JADE;
        _colors[METRIC_NEXT_EVENT] = Palette.GOLD;
        _colors[METRIC_SUN] = Palette.GOLD;
        _colors[METRIC_STEPS] = Palette.STEEL;
        _colors[METRIC_STRESS] = Palette.JADE;
    }

    // Returns { :value, :label, :color, :frac } for a metric.
    // :frac is a 0..1 Float for arc-backed metrics, else null.
    function get(metricId as Lang.Number) as Lang.Dictionary {
        if (_labels == null) {
            _initStrings();
        }
        var value = null;
        var frac = null;
        var label = _labels[metricId];

        if (metricId == METRIC_HRV || metricId == METRIC_STRESS) {
            value = _stressValue();
            // The HRV slot currently renders the Stress proxy, so it must
            // say so on screen ("never render a stale value without
            // indication"). When a real HRV source lands, restore the HRV
            // label alongside it.
            label = _labels[METRIC_STRESS];
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
            if (info != null && info.calories != null) {
                value = info.calories.format("%d");
            }
        } else if (metricId == METRIC_SLEEP) {
            var score = _complicationValue(:sleepScore);
            if (score != null
                    && (score instanceof Lang.Number || score instanceof Lang.Float)) {
                value = score.toNumber().format("%d");
            }
        } else if (metricId == METRIC_HEART_RATE) {
            value = _heartRate();
        } else if (metricId == METRIC_INTENSITY) {
            var info = ActivityMonitor.getInfo();
            if (info != null && info.activeMinutesWeek != null) {
                value = info.activeMinutesWeek.total.format("%d");
            }
        } else if (metricId == METRIC_NEXT_EVENT) {
            value = _nextEvent();
        } else if (metricId == METRIC_SUN) {
            var sun = _sun() as Lang.Array?;
            if (sun != null) {
                value = sun[0];
                label = sun[1];
            }
        } else if (metricId == METRIC_STEPS) {
            var info = ActivityMonitor.getInfo();
            if (info != null && info.steps != null) {
                value = info.steps.format("%d");
                var goal = Config.stepGoalOverride();
                if (goal <= 0 && info.stepGoal != null) {
                    goal = info.stepGoal;
                }
                if (goal > 0) {
                    frac = info.steps.toFloat() / goal;
                    if (frac > 1.0) {
                        frac = 1.0;
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
            :color => _colors[metricId],
            :frac => frac
        };
    }

    // --- accessors -----------------------------------------------------

    // Primary: live activity info. Fallback: newest heart-rate history sample.
    function _heartRate() {
        var info = Activity.getActivityInfo();
        if (info != null && info.currentHeartRate != null) {
            return info.currentHeartRate.format("%d");
        }
        if (ActivityMonitor has :getHeartRateHistory) {
            var it = ActivityMonitor.getHeartRateHistory(1, true);
            if (it != null) {
                var sample = it.next();
                if (sample != null && sample.heartRate != null
                        && sample.heartRate != ActivityMonitor.INVALID_HR_SAMPLE) {
                    return sample.heartRate.format("%d");
                }
            }
        }
        return null;
    }

    // Primary: SensorHistory. Fallback: Body Battery complication.
    function _bodyBattery() {
        var v = _latestSensorSample(:getBodyBatteryHistory);
        if (v != null) {
            return v.toNumber();
        }
        v = _complicationValue(:bodyBattery);
        if (v != null && v instanceof Lang.Number) {
            return v;
        }
        return null;
    }

    // Stress stands in for HRV status (spec section 5 substitution).
    function _stressValue() {
        var v = _latestSensorSample(:getStressHistory);
        if (v != null) {
            return v.toNumber().format("%d");
        }
        return null;
    }

    function _latestSensorSample(historySymbol) {
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
            if (sample != null && sample.data != null) {
                return sample.data;
            }
        }
        return null;
    }

    // Primary: ActivityMonitor timeToRecovery (hours, `has`-guarded).
    // Fallback: Recovery Time complication, which reports seconds.
    function _recoveryHours() {
        var info = ActivityMonitor.getInfo();
        if (info != null && (info has :timeToRecovery) && info.timeToRecovery != null) {
            return info.timeToRecovery;
        }
        var v = _complicationValue(:recovery);
        if (v != null && v instanceof Lang.Number) {
            return (v / 60) / 60;
        }
        return null;
    }

    // Next event is not natively exposed to watch faces (spec "Workaround"
    // row): use the calendar-events complication when the device offers it.
    function _nextEvent() {
        var v = _complicationValue(:calendar);
        if (v != null) {
            if (v instanceof Lang.String && v.length() > 0) {
                return v;
            }
            if (v instanceof Lang.Number) {
                return v.format("%d");
            }
        }
        return null;
    }

    // Primary: Weather sunrise/sunset for the last known position.
    // Returns [formatted time, RISE/SET label] for the next sun event.
    function _sun() {
        if (!(Toybox has :Weather)) {
            return null;
        }
        var weather = Toybox.Weather;
        if (!((weather has :getSunrise) && (weather has :getSunset))) {
            return null;
        }
        var cc = weather.getCurrentConditions();
        if (cc == null || cc.observationLocationPosition == null) {
            return null;
        }
        var pos = cc.observationLocationPosition;
        var now = Time.now();
        var sunrise = weather.getSunrise(pos, now);
        var sunset = weather.getSunset(pos, now);
        if (sunrise != null && now.lessThan(sunrise)) {
            return [_formatMoment(sunrise), _labels[METRIC_SUN]];
        }
        if (sunset != null && now.lessThan(sunset)) {
            return [_formatMoment(sunset), _sunsetLabel];
        }
        var tomorrow = now.add(new Time.Duration(Gregorian.SECONDS_PER_DAY));
        var nextRise = weather.getSunrise(pos, tomorrow);
        if (nextRise != null) {
            return [_formatMoment(nextRise), _labels[METRIC_SUN]];
        }
        return null;
    }

    function _formatMoment(moment) {
        var info = Gregorian.info(moment, Time.FORMAT_SHORT);
        return info.hour.format("%02d") + ":" + info.min.format("%02d");
    }

    // --- date helpers (used by the painter) ----------------------------

    // "11.08 · WEEK 33" per spec section 3.2. Week number is day-of-year
    // based (approximation documented in the project README).
    function dateString() {
        if (_labels == null) {
            _initStrings();
        }
        var info = Gregorian.info(Time.now(), Time.FORMAT_SHORT);
        var doy = _dayOfYear(info.year, info.month, info.day);
        var week = ((doy - 1) / 7) + 1;
        var d = info.day.format("%02d");
        var m = info.month.format("%02d");
        var datePart = (Config.dateFormat() == 0) ? (d + "." + m) : (m + "." + d);
        return datePart + " " + _weekPrefix + " " + week.format("%d");
    }

    // 1 = Sunday ... 7 = Saturday
    function dayOfWeek() {
        var info = Gregorian.info(Time.now(), Time.FORMAT_SHORT);
        return info.day_of_week;
    }

    function _dayOfYear(year, month, day) {
        var cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        var doy = cum[month - 1] + day;
        if (month > 2 && ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0)) {
            doy++;
        }
        return doy;
    }
}
