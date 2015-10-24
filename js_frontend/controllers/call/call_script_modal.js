/**
    CallScriptModalController: Shows the call script for a call
**/
var CallScriptModalController = BaseShareModalController.extend({
    
    init: function() {
        this.render();
        this.show();
    },

    render: function() {
        var overlay = this.base_render();

        overlay.firstChild.appendChild(CallScriptModalView({}));

        this.html(overlay);
    }
});