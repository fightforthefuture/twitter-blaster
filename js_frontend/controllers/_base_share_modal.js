/**
    BaseShareModalController: Modal for sharing
**/
var BaseShareModalController = BaseModalController.extend({
    events: {
        'click a.close': 'click_close',
        'click .social.twitter': 'tweet',
        'click .social.facebook': 'share'
    },

    elements: {
    },

    share: function(e) {
        e.preventDefault();
        util.share();
    },

    tweet: function(e) {
        e.preventDefault();
        util.tweet();
    }

});