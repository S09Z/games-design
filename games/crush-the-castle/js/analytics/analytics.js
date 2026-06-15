// Analytics stub - logs events to console
var Analytics = (function() {
    var enabled = true;
    var events = [];

    function track(event, data) {
        if (!enabled) return;
        var entry = {
            event: event,
            data: data || {},
            timestamp: Date.now()
        };
        events.push(entry);
        console.log('[Analytics]', event, data);
    }

    function getEvents() {
        return events.slice();
    }

    function clear() {
        events = [];
    }

    function disable() { enabled = false; }
    function enable() { enabled = true; }

    return {
        track: track,
        getEvents: getEvents,
        clear: clear,
        enable: enable,
        disable: disable
    };
})();
