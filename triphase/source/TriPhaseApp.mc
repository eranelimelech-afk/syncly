using Toybox.Application;
using Toybox.WatchUi;

// App entry point. Owns the complication subscriptions (spec section 5:
// subscribe once at startup, never instantiate complications per draw).
class TriPhaseApp extends Application.AppBase {

    function initialize() {
        AppBase.initialize();
    }

    function onStart(state) {
        if (Toybox has :Complications) {
            Toybox.Complications.registerComplicationChangeCallback(method(:onComplicationChanged));
            $.Fields.subscribeComplications();
        }
    }

    function onStop(state) {
    }

    function getInitialView() {
        return [new TriPhaseView()];
    }

    function onComplicationChanged(complicationId as Toybox.Complications.Id) as Void {
        var c = Toybox.Complications.getComplication(complicationId);
        if (c != null) {
            $.Fields.storeComplication(c.getType(), c.value);
        }
    }

    function onSettingsChanged() {
        $.Config.reload();
        WatchUi.requestUpdate();
    }
}
