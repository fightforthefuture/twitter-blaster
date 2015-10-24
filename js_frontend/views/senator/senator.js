var SenatorView = function(data) {
    var div = $c('div');

    var img = $c('div');
    img.style.background ='url(../congress/'+data.senator.image+') center center';
    img.style.backgroundSize = '100% auto';
    img.className = 'img';
    div.appendChild(img);

    var h4 = $c('h4');
    h4.textContent = data.senator.first_name + ' ' + data.senator.last_name;
    div.appendChild(h4);

    var h3 = $c('h3');
    h3.textContent = data.senator.state;
    div.appendChild(h3);

    var ul = $c('ul');
    var li1 = $c('li');
    var a1 = $c('a');
    a1.href = 'tel://'+data.senator.phone;
    a1.textContent = data.senator.phone;
    li1.appendChild(a1);
    ul.appendChild(li1);
    var li2 = $c('li');
    var a2 = $c('a');
    a2.href = 'https://twitter.com/'+data.senator.twitter;
    a2.className = 'tw';
    a2.textContent = '@'+data.senator.twitter;
    li2.appendChild(a2);
    ul.appendChild(li2);
    div.appendChild(ul);

    return div;
};