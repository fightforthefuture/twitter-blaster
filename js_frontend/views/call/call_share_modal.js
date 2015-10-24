var CallShareModalView = function(data) {
    var div = $c('div');
    div.className = 'modal _call_modal';

    var a = $c('a');
    a.className = 'close';
    a.textContent = '×';
    a.href = '#';
    div.appendChild(a);

    var h2 = $c('h2');
    h2.textContent = 'Please share this page to spread the word.';
    div.appendChild(h2);

    var p = $c('p');
    p.textContent = 'We can still win this if enough people take action!';
    div.appendChild(p);

    var shares = $c('div');
    shares.className = '_call_shares';

    var a = $c('a');
    a.className = 'social twitter';
    a.href = '#';
    a.textContent = 'Tweet this';
    shares.appendChild(a);

    var a = $c('a');
    a.className = 'social facebook';
    a.href = '#';
    a.textContent = 'Share this';
    shares.appendChild(a);

    var a = $c('a');
    a.className = 'social donate';
    a.href = 'https://donate.fightforthefuture.org?amount=5';
    a.textContent = 'Donate $5';
    a.target = '_blank';
    shares.appendChild(a);

    div.appendChild(shares);

    return div;
}