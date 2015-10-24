/**
    CallModalController: Shows the Call modal
**/
var CallModalController = BaseModalController.extend({
    events: {
        'click a.close': 'click_close',
        'submit form': 'submit',
        'click ._call_controls a': 'showShareModal'
    },

    elements: {
        'input': 'phone_number',
        'button': 'button'
    },

    zipcode: null,


    init: function(fax) {
        this.render();
        this.show();
        this.with_bind(this, 'setZipcode', this.setZipcode.bind(this));
    },

    render: function() {
        var overlay = this.base_render();

        overlay.firstChild.appendChild(CallModalView());

        this.html(overlay);
    },

    before_hide: function() {
    },

    submit: function(e) {
        e.preventDefault();
        console.log('Call submit');

        var phone = this.phone_number.value;

        if (!util.validatePhone(phone))
            return alert('Please enter a valid US phone number!');

        var data = new FormData();
        data.append('campaignId', CALL_CAMPAIGN);

        if (this.zipcode)
            data.append('zipcode', this.zipcode);

        data.append('userPhone', util.validatePhone(phone));

        var url = 'https://call-congress.fightforthefuture.org/create';

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                console.log('sent!', xhr.response);
            }
        }.bind(this);
        xhr.open("post", url, true);
        xhr.send(data);

        this.button.disabled = true;
        this.button.className = 'gray';
        this.button.textContent = "calling...";

        setTimeout(function() {
            new CallScriptModalController();
            this.hide();
        }.bind(this), 3000);
    },

    setZipcode: function(zipcode) {
        if (zipcode)
            this.zipcode = zipcode;
    },

    showShareModal: function(e) {
        e.preventDefault();
        new CallShareModalController();
        this.hide();
    }
});