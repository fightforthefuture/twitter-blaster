var CallModalView = function(data) {
    var div = $c('div');
    div.className = 'modal _call_modal';

    var a = $c('a');
    a.className = 'close';
    a.textContent = '×';
    a.href = '#';
    div.appendChild(a);

    var h2 = $c('h2');
    h2.textContent = 'Thanks! Now can you call your senators?'
    div.appendChild(h2);

    var p = $c('p');
    p.textContent = 'With just hours before a crucial vote, phone calls are the best way to reach your lawmakers quickly. Enter your phone number and we\'ll call your phone and connect you to your Senators.';
    div.appendChild(p);

    var controls = $c('div');
    controls.className = '_call_controls';

    var form = $c('form');

    var input = $c('input');
    input.placeholder = 'Your phone number';
    form.appendChild(input);

    var button = $c('button');
    button.textContent = 'Call now!';
    button.type = 'submit';
    form.appendChild(button);

    controls.appendChild(form);

    var cant = $c('a');
    cant.href = '#';
    cant.textContent = 'Can\'t make a call? Click here to share this page instead!';
    controls.appendChild(cant);

    div.appendChild(controls);

    return div;
}