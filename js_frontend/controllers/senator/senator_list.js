/**
    SenatorListController: Shows a list of senators
**/
var SenatorListController = Composer.ListController.extend({
    elements: {
        'div.target_list': 'el_list',
        'select': 'select'
    },

    events: {
        'change select': 'sort'
    },

    inject: '#targets',

    collection: null,

    init: function() {
        this.render();

        this.track(this.collection, function(model, options) {
            return new SenatorController({
                inject: this.el_list,
                model: model
            });
        }.bind(this), {bind_reset: true})

        this.sort();
    },

    render: function() {
        var div = SenatorListView({});
        this.html(div);
    },

    sort: function() {
        var sortType = this.select.options[this.select.selectedIndex].value;

        if (sortType == 'name')
            this.collection.sortfn = function(a, b) {
                if (a.get('last_name') < b.get('last_name'))
                    return -1;
                if (a.get('last_name') > b.get('last_name'))
                    return 1;
                return 0;
            };
        else
            this.collection.sortfn = function(a, b) {
                if (a.get('state') < b.get('state'))
                    return -1;
                if (a.get('state') > b.get('state'))
                    return 1;
                return 0;
            };
        this.collection.sort();
    }
});