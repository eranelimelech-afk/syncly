# Device stubs for offline compile-checking

Garmin distributes real device definitions only through the SDK Manager, which
requires a Garmin developer login. These stubs let `monkeyc` build TriPhase in
an environment without that login (CI, containers):

```sh
mkdir -p ~/.Garmin/ConnectIQ/Devices
cp -r tools/device-stubs/fenix* ~/.Garmin/ConnectIQ/Devices/
monkeyc -f monkey.jungle -o bin/TriPhase.prg -y <developer_key> -d fenix8pro47mm -w
```

The device ids and screen resolutions are real (taken from SDK 9.2.0's
`resources/device-reference`); everything else — part numbers, firmware
versions, memory limits — is fabricated to satisfy the compiler's schema and
MUST NOT be treated as device truth. Sideloadable/store builds should be made
with the genuine device files from the SDK Manager; only they carry the real
memory limits, palettes, and font metrics that gate what actually fits on the
watch.
