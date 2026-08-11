#!/usr/bin/env python3
"""Generate settings.xml, properties.xml and launcher_icon.png for TriPhase."""
import struct, zlib, math, os

ROOT = "/home/user/syncly/triphase/resources"

SLOTS = [
    ("field_hrv", "SetSlotHrv", 0),
    ("field_bat", "SetSlotBat", 1),
    ("field_bb", "SetSlotBb", 2),
    ("field_rec", "SetSlotRec", 3),
    ("field_cal", "SetSlotCal", 4),
    ("field_sleep", "SetSlotSleep", 5),
    ("field_hr", "SetSlotHr", 6),
    ("field_int", "SetSlotInt", 7),
    ("field_next", "SetSlotNext", 8),
    ("field_sun", "SetSlotSun", 9),
    ("field_steps", "SetSlotSteps", 10),
]

METRICS = [
    "MetricHrv", "MetricBattery", "MetricBodyBattery", "MetricRecovery",
    "MetricCalories", "MetricSleep", "MetricHeartRate", "MetricIntensity",
    "MetricNextEvent", "MetricSun", "MetricSteps", "MetricStress",
]

# ---- properties.xml ----
props = ['<?xml version="1.0" encoding="UTF-8"?>', "<resources>", "    <properties>"]
props.append('        <property id="emphasisMode" type="number">0</property>')
props.append('        <property id="morningStart" type="number">240</property>')
props.append('        <property id="dayStart" type="number">510</property>')
props.append('        <property id="eveningStart" type="number">1200</property>')
props.append('        <property id="accentColor" type="number">0</property>')
props.append('        <property id="showSeconds" type="boolean">true</property>')
props.append('        <property id="showWeekday" type="boolean">true</property>')
props.append('        <property id="showTicks" type="boolean">true</property>')
props.append('        <property id="stepGoalOverride" type="number">0</property>')
props.append('        <property id="aodFields" type="number">1</property>')
props.append('        <property id="dateFormat" type="number">0</property>')
for key, _, default in SLOTS:
    props.append(f'        <property id="{key}" type="number">{default}</property>')
props += ["    </properties>", "</resources>", ""]
with open(f"{ROOT}/settings/properties.xml", "w") as f:
    f.write("\n".join(props))

# ---- settings.xml ----
def list_setting(key, title, entries):
    out = [f'        <setting propertyKey="@Properties.{key}" title="@Strings.{title}">']
    out.append('            <settingConfig type="list">')
    for value, label in entries:
        out.append(f'                <listEntry value="{value}">@Strings.{label}</listEntry>')
    out.append('            </settingConfig>')
    out.append('        </setting>')
    return out

def number_setting(key, title, minv, maxv):
    return [
        f'        <setting propertyKey="@Properties.{key}" title="@Strings.{title}">',
        f'            <settingConfig type="numeric" min="{minv}" max="{maxv}"/>',
        '        </setting>',
    ]

def bool_setting(key, title):
    return [
        f'        <setting propertyKey="@Properties.{key}" title="@Strings.{title}">',
        '            <settingConfig type="boolean"/>',
        '        </setting>',
    ]

s = ['<?xml version="1.0" encoding="UTF-8"?>', "<resources>", "    <settings>"]
s += list_setting("emphasisMode", "SetEmphasisMode", [
    (0, "EmphAuto"), (1, "EmphMorning"), (2, "EmphDay"),
    (3, "EmphEvening"), (4, "EmphFlat")])
s += number_setting("morningStart", "SetMorningStart", 0, 1439)
s += number_setting("dayStart", "SetDayStart", 0, 1439)
s += number_setting("eveningStart", "SetEveningStart", 0, 1439)
s += list_setting("accentColor", "SetAccentColor", [
    (0, "AccentGold"), (1, "AccentSteel"), (2, "AccentJade"),
    (3, "AccentEmber"), (4, "AccentWhite")])
s += bool_setting("showSeconds", "SetShowSeconds")
s += bool_setting("showWeekday", "SetShowWeekday")
s += bool_setting("showTicks", "SetShowTicks")
s += number_setting("stepGoalOverride", "SetStepGoalOverride", 0, 100000)
s += list_setting("aodFields", "SetAodFields", [
    (0, "AodTimeOnly"), (1, "AodTimeBb"), (2, "AodTimeBbSteps"),
    (3, "AodTimeBattery")])
s += list_setting("dateFormat", "SetDateFormat", [(0, "DateDdMm"), (1, "DateMmDd")])
for key, title, _ in SLOTS:
    s += list_setting(key, title, list(enumerate(METRICS)))
s += ["    </settings>", "</resources>", ""]
with open(f"{ROOT}/settings/settings.xml", "w") as f:
    f.write("\n".join(s))

# ---- launcher_icon.png (60x60): dark disc, gold 3-segment ring ----
W = H = 60
INK = (4, 6, 10)
GOLD = (210, 172, 88)
JADE = (79, 179, 156)
STEEL = (127, 179, 213)

px = [[(0, 0, 0, 0) for _ in range(W)] for _ in range(H)]
cx = cy = (W - 1) / 2.0
for y in range(H):
    for x in range(W):
        d = math.hypot(x - cx, y - cy)
        if d <= 28:
            px[y][x] = (*INK, 255)
        ang = math.degrees(math.atan2(-(y - cy), x - cx)) % 360
        if 22 <= d <= 26:
            seg = None
            if 100 <= ang < 210:
                seg = JADE
            elif 220 <= ang < 330:
                seg = GOLD
            elif ang >= 340 or ang < 90:
                seg = STEEL
            if seg:
                px[y][x] = (*seg, 255)
# center "time" bar
for y in range(27, 33):
    for x in range(18, 42):
        px[y][x] = (255, 255, 255, 255)

raw = b""
for row in px:
    raw += b"\x00" + b"".join(struct.pack("4B", *p) for p in row)

def chunk(tag, data):
    c = struct.pack(">I", len(data)) + tag + data
    return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

png = b"\x89PNG\r\n\x1a\n"
png += chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 6, 0, 0, 0))
png += chunk(b"IDAT", zlib.compress(raw, 9))
png += chunk(b"IEND", b"")
with open(f"{ROOT}/drawables/launcher_icon.png", "wb") as f:
    f.write(png)

print("properties.xml:", os.path.getsize(f"{ROOT}/settings/properties.xml"), "bytes")
print("settings.xml:", os.path.getsize(f"{ROOT}/settings/settings.xml"), "bytes")
print("launcher_icon.png:", os.path.getsize(f"{ROOT}/drawables/launcher_icon.png"), "bytes")
