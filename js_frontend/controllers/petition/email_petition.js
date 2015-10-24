/**
    EmailPetitionController: Last-ditch petition to stop the CISA
**/
var EmailPetitionController = Composer.Controller.extend({
    elements: {
        'input[name=first_name]': 'first_name',
        'input[name=email]': 'email',
        'input[name=address1]': 'address1',
        'input[name=zip]': 'zip',
        'input[name=subject]': 'subject',
        'textarea': 'textarea',
        'div.thanks': 'thanks',
        'form': 'form'
    },

    events: {
        'submit form': 'submit',
    },

    orgController: null,

    init: function() {
        this.orgController = new OrgReferralController({el: '#petition_disc'});
    },

    submit: function(e) {
        e.preventDefault();
        console.log('submit');

        var error = false;

        var add_error = function(el) {
            el.className = 'error';
            error = true;
        };

        if (!this.first_name.value) add_error(this.first_name);
        if (!this.email.value) add_error(this.email);
        if (!this.address1.value) add_error(this.address1);
        if (!this.zip.value) add_error(this.zip);

        if (error) return alert('Please fill out all fields :)');

        this.orgController.submit({
            email:          this.email.value,
            first_name:     this.first_name.value,
            address1:       this.address1.value,
            zip:            this.zip.value,
            subject:        EMAIL_SUBJECT,
            action_comment: this.textarea.value
        }, {default_org: 'fftf'});

        this.form.style.display = 'none';
        this.thanks.style.display = 'block';

        var callController = new CallModalController();
        callController.trigger('setZipcode', this.zip.value);
    },
});
