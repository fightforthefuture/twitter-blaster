/**
    Shows the Fax Composer form
**/
var FaxComposerFormController = Composer.Controller.extend({
    events: {
        // 'click ._fax_login': 'login',
        // 'click ._fax_logout': 'doLogoutUser',
        'click ._fax_photo': 'addPhoto',
        'click ._fax_webcam': 'showWebcamModal',
        'click ._fax_file': 'openFile',
        'change input[type=file]': 'handleFile',
        'click ._fax_preview a': 'clearPhoto',
        'click ._fax_submit': 'submitFax',
        'click .social.facebook': 'share',
        'click .social.twitter': 'tweet',
        'focus textarea': 'focusTextarea',
        'blur textarea': 'blurTextarea',
        'keydown textarea': 'autosizeTextarea',
    },

    elements: {
        // '._fax_login': 'login_button',
        // '._fax_avatar': 'avatar',
        'textarea': 'textarea',
        // '._fax_logout': 'logout_button',
        '._fax_photo': 'photo_button',
        '._fax_photo ul': 'photo_menu',
        'input[type=file]': 'file',
        '._fax_preview': 'preview',
        'input._fax_email': 'email',
        '._fax_submit': 'submit_button',
        '._fax_thanks': 'thanks_container',
        '._fax_body': 'body_container',
        '._fax_user': 'user_container',
        'ul': 'menu'
    },

    el: '#compose',

    user: null,
    photoData: null,
    editKey: null,
    sentFaxAccessToken: null,
    faxTag: null,

    defaultTextareaText: 'Enter your fax here.',
    defaultAvatarUrl: '/images/site/default_avatar.png',

    init: function() {
        this.render();

        this.with_bind(this, 'showForm', this.showComposeForm.bind(this));
        this.with_bind(this, 'hideForm', this.hideComposeForm.bind(this));

        // JL HACK
        this.menu.addEventListener('mouseleave', this.hidePhotoMenu.bind(this));
    },

    render: function() {
        var container = FaxComposerFormView({
            defaultText: this.defaultTextareaText,
        });

        this.html(container);
    },

    focusTextarea: function() {
        if (this.textarea.value == this.defaultTextareaText)
            this.textarea.value = '';

        this.textarea.className = '_fax_expanded';
    },

    blurTextarea: function() {
        if (this.textarea.value == '') {
            this.textarea.style.cssText = '';
            this.textarea.value = this.defaultTextareaText;
            this.textarea.className = '';
        }
    },

    autosizeTextarea: function() {
        var el = this.textarea;
        setTimeout(function(){
            el.style.cssText = 'height:auto;';
            var height = el.scrollHeight > 108 ? el.scrollHeight : 95;
            // for box-sizing other than "content-box" use:
            // el.style.cssText = '-moz-box-sizing:content-box';
            el.style.cssText = 'height:' + height + 'px';
        },0);
    },

    addPhoto: function(e) {
        e.preventDefault();

        this.showPhotoMenu();
    },

    showPhotoMenu: function() {
        this.photo_button.className = '_fax_photo _fax_active';
        this.photo_menu.style.display = 'block';
    },

    hidePhotoMenu: function() {
        this.photo_button.className = '_fax_photo';
        this.photo_menu.style.display = 'none';
    },

    showWebcamModal: function(e) {
        e.preventDefault();
        this.track_subcontroller('webcam_modal', function() {
            var webcam_modal = new FaxWebcamModalController({});

            this.with_bind_once(webcam_modal, 'attach', function(data) {
                this.photoData = data;
                this.showPhoto();
            }.bind(this), 'webcam_attached_file');

            return webcam_modal;
        }.bind(this));
    },

    getBase64PhotoData: function() {
        return this.photoData.replace(/^data:image\/(png|jpg|jpeg);base64,/,"");
    },

    openFile: function() {
        this.file.click();
    },

    handleFile: function() {
        if (this.file.files && this.file.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                this.photoData = e.target.result;
                this.showPhoto();
            }.bind(this)

            reader.readAsDataURL(this.file.files[0]);
        }
    },

    showPhoto: function() {
        this.preview.style.backgroundImage = 'url('+this.photoData+')';
        this.preview.style.backgroundSize = 'auto 100%';
        this.preview.style.backgroundPosition = 'center center';
        this.preview.style.backgroundRepeat = 'no-repeat';
        this.preview.style.display = 'block';
        this.photo_button.style.display = 'none';
    },

    clearPhoto: function(e) {
        e.preventDefault();
        this.photoData = null;
        this.preview.style.display = 'none';
        this.photo_button.style.display = 'inline-block';
        this.file.value=''; 
    },

    submitFax: function() {
        var body = this.textarea.value.trim();

        if (body == this.defaultTextareaText || body == '') {
            alert('Please enter a message to Congress :)');
            return this.textarea.focus();
        }

        this.submit_button.disabled = true;

        var data = new FormData();

        if (user && user.get('social_user_id'))
            data.append('social_user_id', user.get('social_user_id'));

        if (this.file.files && this.file.files[0])
            data.append('photo_file', this.file.files[0]);
        else if (this.photoData)
            data.append('photo_data', this.getBase64PhotoData());

        if (this.editKey)
            data.append('edit_token', this.editKey);

        if (this.faxTag)
            data.append('tag', this.faxTag);

        data.append('email', this.email.value.trim());
        data.append('body', body);

        var xhr = new XMLHttpRequest();
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4)
            {
                this.submit_button.disabled = false;
                var response = JSON.parse(xhr.response);

                console.log('RESPONSE: ', response);

                if (response.error)
                    return alert(response.error);

                this.editKey = null;
                this.sentFaxAccessToken = response.access_token;

                response._is_new = true;
                new FaxModalController({fax: response});

                if (typeof window.orgController != "undefined")
                    orgController.trigger('submit', {
                        email: this.email.value.trim()
                    });

                this.hideComposeForm();
            }
        }.bind(this);
        xhr.open("post", '/fax', true);
        xhr.send(data);
    },

    hideComposeForm: function() {
        this.body_container.style.display = 'none';
        // this.user_container.style.display = 'none';
        this.thanks_container.style.display = 'block';
    },

    showComposeForm: function(fax) {
        this.body_container.style.display = 'inline-block';
        // this.user_container.style.display = 'inline-block';
        this.thanks_container.style.display = 'none';
        if (fax) {
            this.textarea.value = fax.body;
            this.focusTextarea();
            this.autosizeTextarea();
            if (fax.edit_token)
                this.editKey = fax.edit_token;
        }
    },

    share: function(e) {
        e.preventDefault();
        util.share(this.sentFaxAccessToken);
    },

    tweet: function(e) {
        e.preventDefault();
        util.tweet(this.sentFaxAccessToken);
    }
});