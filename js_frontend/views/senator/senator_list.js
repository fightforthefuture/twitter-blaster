var SenatorListView = function(data) {
    var div = $c('div');

    var label = $c('label');
    label.textContent = 'Sort by:';
    label.htmlFor = 'senator_sort_select';
    div.appendChild(label);

    var select = $c('select');
    var option = $c('option');
    option.value = 'name';
    option.textContent = 'Senator name';
    select.appendChild(option);
    var option = $c('option');
    option.value = 'state';
    option.textContent = 'Senator state';
    select.appendChild(option);
    div.appendChild(select);

    var targets = $c('div');
    targets.className = 'target_list';
    div.appendChild(targets);

    return div;
};