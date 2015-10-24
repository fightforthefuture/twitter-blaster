/**
    SenatorController: Shows a senator
**/
var SenatorController = Composer.Controller.extend({

    events: {
        'click a.tw': 'tweet',
        'click h4': 'tweet',
        'click .img': 'tweet'
    },

    model: null,

    init: function() {
        this.render();
    },

    render: function() {
        var div = SenatorView({
            senator: this.model.toJSON()
        });
               
        this.html(div);
        this.el.className = 'senator';
    },

    tweet: function(e) {
        e.preventDefault();
        var txt = encodeURIComponent('.@'+this.model.get('twitter')+', '+EMERGENCY_TWEET);
        window.open('https://twitter.com/intent/tweet?text='+txt);
    }

});