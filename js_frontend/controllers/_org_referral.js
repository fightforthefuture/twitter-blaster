/**
    BaseModalController: Provides common functionality for modals. All modals
    extend this.
**/
var OrgReferralController = Composer.Controller.extend({
    init: function() {
        this.with_bind(this, 'submit', this.submit.bind(this));
        this.handleDisclosure();
    },

    handleDisclosure: function() {
        if (typeof window.org == 'undefined' || !window.org)
            return;

        var ps = this.el.querySelectorAll('p');

        for (var i = 0; i < ps.length; i++)
            if (ps[i].className.indexOf(window.org) == -1)
                ps[i].style.display = 'none';
            else
                ps[i].style.display = 'block';
    },

    submit: function(data, options) {
        options || (options = {});

        if (
            (typeof window.org == 'undefined' || !window.org)
            &&
            !options.default_org
        )
            return;

        console.log('submit: ', data.email, '; org: ', org);

        var formData = new FormData();
        formData.append('guard', '');
        formData.append('hp_enabled', true);
        formData.append('member[email]', data.email);

        if (data.first_name)
            formData.append('member[first_name]', data.first_name);
        
        if (data.address1)
            formData.append('member[street_address]', data.address1);

        if (data.zip)
            formData.append('member[postcode]', data.zip);

        if (data.subject)
            formData.append('subject', data.subject);

        if (data.action_comment)
            formData.append('action_comment', data.action_comment);

        formData.append('org', window.org || options.default_org);
        formData.append('tag', TAG);

        var url = 'https://queue.fightforthefuture.org/action';

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                console.log('response:', xhr.response);
            }
        }.bind(this);
        xhr.open("post", url, true);
        xhr.send(formData);
    }
});