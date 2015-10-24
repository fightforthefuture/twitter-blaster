/**
 *  util : random grab bag functions
 */
var util = {
    getParameterByName: function(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    },

    share: function(accessToken) {
        var url = FACEBOOK_SHARE_URL;

        if (accessToken)
            url += encodeURIComponent('/fax/') + accessToken;

        if (typeof window.org != 'undefined' && window.org)
            url += encodeURIComponent('?org=') + window.org;

        window.open(url);
    },

    tweet: function(accessToken) {
        var url = window.location.protocol + '//' + window.location.host;

        if (accessToken)
            url += '/fax/' + accessToken;

        if (typeof window.org != 'undefined' && window.org)
            url += '?org=' + window.org;

        if (accessToken) {
            var tweet = encodeURIComponent(FAXED_TWEET + url);
        } else {
            var tweet = encodeURIComponent(DEFAULT_TWEET + url);
        }
        window.open('https://twitter.com/intent/tweet?text='+tweet);
    },

    generateSpinner: function() {
        var spinContainer = $c('div');
        spinContainer.className = '_fax_spinner_container';

        var spinner = $c('div');
        spinner.className = '_fax_spinner';
        spinContainer.appendChild(spinner);

        for (var i = 1; i <= 12; i++) {
            var blade = $c('div');
            blade.className = '_fax_blade _fax_d' + (i < 10 ? '0'+i : i);

            var subdiv = $c('div');
            blade.appendChild(subdiv);

            spinner.appendChild(blade);
        }
        return spinContainer;
    },

    supportsLocalstorage: function() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    },

    validatePhone: function(num) {
        num = num.replace(/\s/g, '').replace(/\(/g, '').replace(/\)/g, '');
        num = num.replace("+", "").replace(/\-/g, '');

        if (num.charAt(0) == "1")
            num = num.substr(1);

        if (num.length != 10)
            return false;

        return num;
    }
}