/**
 *  UserModel: tracks the user's social login state
 */
var UserModel = Composer.Model.extend({
    init: function() {
        if (util.supportsLocalstorage() && localStorage['user'])
            this.doLoginUser(JSON.parse(localStorage['user']));
    },

    openLoginModal: function() {

        var settings =  "toolbar=no,location=yes,directories=no," +
                        "status=no,menubar=no,scrollbars=yes," +
                        "resizable=yes,width="+640+",height="+480;

        window.open('/auth/twitter', 'billy', settings);
    },

    authSuccess: function(data) {
        this.doLoginUser(JSON.parse(data));
    },

    doLoginUser: function(user) {
        this.set(user);

        if (util.supportsLocalstorage())
            localStorage["user"] = JSON.stringify(user);

        this.trigger('login');
    },

    doLogoutUser: function(user) {
        this.clear();

        if (util.supportsLocalstorage())
            delete localStorage["user"];

        this.trigger('logout');
    },
});