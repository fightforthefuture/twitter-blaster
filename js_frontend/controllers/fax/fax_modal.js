/**
    FaxModalController: Shows the Fax sharing modal
**/
var FaxModalController = BaseModalController.extend({
    events: {
        'click a.close': 'click_close',
        'click a._fax_edit': 'editFax',
        'click a._fax_send': 'sendFax',
        'click a._fax_add_twitter': 'connectTwitter',
        'click .social.twitter': 'tweet',
        'click .social.facebook': 'share'
    },

    elements: {
        '._fax_spinner_container': 'spinner',
        '._fax_page a': 'page',
        '._fax_edit_options': 'edit_options'
    },

    fax: null,

    init: function(fax) {
        var e = util.getParameterByName('e');

        if (e && !this.fax.edit_token)
            this.fax.edit_token = e

        console.log('fax: ', this.fax);
        this.render();
        this.show();

        var img = new Image();
        img.src = '/fax/'+this.fax.access_token+'/image.png';
        img.onload = this.showPage.bind(this);
        setTimeout(this.showPage.bind(this), 4000);
    },

    render: function() {
        var overlay = this.base_render();

        overlay.firstChild.appendChild(FaxModalView({
            fax: this.fax,
            user: user.toJSON()
        }));

        this.html(overlay);

        document.body.className = document.body.className + ' _fax_no_overflow';
    },

    before_hide: function() {
        var className = document.body.className;
        document.body.className = className.replace(/_fax_no_overflow/g, '');
    },

    editFax: function(e) {
        e.preventDefault();
        faxForm.trigger('showForm', this.fax);
        window.location.href = '#_fax_form';
        this.hide();
    },

    sendFax: function(e) {
        e.preventDefault();
        this.hide();
    },

    share: function(e) {
        e.preventDefault();

        var token = null;

        if (this.fax._is_new || this.fax.edit_token)
            token = this.fax.access_token;

        util.share(token);
    },

    tweet: function(e) {
        e.preventDefault();

        var token = null;

        if (this.fax._is_new || this.fax.edit_token)
            token = this.fax.access_token;

        util.tweet(token);
    },

    connectTwitter: function(e) {
        e.preventDefault();
        user.openLoginModal();
        this.with_bind_once(user, 'login', this.addTwitter.bind(this), 'login');
    },

    blurPage: function() {
        this.page.style.opacity = '.3';
        this.spinner.style.display = 'block';
    },

    showPage: function() {
        this.page.style.opacity = 1;
        this.spinner.style.display = 'none';
    },

    addTwitter: function() {
        this.blurPage();
        this.edit_options.style.display = 'none';

        var data = new FormData();

        data.append('social_user_id', user.get('social_user_id'));
        data.append('edit_token', this.fax.edit_token);

        console.log('edit token: ', this.fax.edit_token);

        var xhr = new XMLHttpRequest();
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4)
            {
                var response = JSON.parse(xhr.response);

                if (response.error) {
                    this.showPage();
                    this.edit_options.style.display = 'block';
                    return alert(response.error);
                }

                console.log('response: ', response);
                var img = new Image();
                var url = '/fax/'+this.fax.access_token+'/image.png?replace=1';
                img.src = url;

                var imageLoaded = function() {
                    this.showPage();
                    this.page.href = url;
                    this.page.style.backgroundImage = 'url('+url+')';
                    this.page.style.backgroundSize = '100% 100%';
                }.bind(this);

                img.onload = imageLoaded;
                setTimeout(imageLoaded, 4000);
            }
        }.bind(this);
        xhr.open("post", '/fax/'+this.fax.access_token+'/addTwitter', true);
        xhr.send(data);
    },

});