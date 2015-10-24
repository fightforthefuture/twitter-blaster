/**
    CallShareModalController: Shows the share modal for a call
**/
var CallShareModalController = BaseShareModalController.extend({
    
    init: function() {
        this.render();
        this.show();
    },

    render: function() {
        var overlay = this.base_render();

        overlay.firstChild.appendChild(CallShareModalView({}));

        this.html(overlay);
    }
});