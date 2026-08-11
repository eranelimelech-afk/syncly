using Toybox.Application;
using Toybox.Lang;
using Toybox.WatchUi;

// App entry point. Owns the complication subscriptions (spec section 5:
// subscribe once at startup, never instantiate complications per draw).
class TriPhaseApp extends Application.AppBase {

    function initialize() {
        AppBase.initialize();
    }

    function onStart(state as Lang.Dictionary?) as Void {
        if (Toybox has :Complications) {
            Toybox.Complications.registerComplicationChangeCallback(method(:onComplicationChanged));
            $.Fields.subscribeComplications();
        }
    }

    function onStop(state as Lang.Dictionary?) as Void {
    }

    function getInitialView() {
        return [new TriPhaseView()];
    }

    function onComplicationChanged(complicationId as Toybox.Complications.Id) as Void {
        var c = Toybox.Complications.getComplication(complicationId);
        if (c != null) {
            var type = c.getType();
            if (type != null) {
                $.Fields.storeComplication(type, c.value);
            }
        }
    }

    function onSettingsChanged() as Void {
        $.Config.reload();
        WatchUi.requestUpdate();
    }
}
