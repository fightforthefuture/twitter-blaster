var CallScriptModalView = function(data) {
    var div = $c('div');
    div.className = 'modal _call_modal';

    var a = $c('a');
    a.className = 'close';
    a.textContent = '×';
    a.href = '#';
    div.appendChild(a);

    var h2 = $c('h2');
    h2.textContent = 'Awesome! We\'re calling your phone!';
    div.appendChild(h2);

    var p = $c('p');
    p.className = 'nopad';
    p.textContent = 'Please be polite and tell your lawmaker:';
    div.appendChild(p);

    var script = $c('div');
    script.className = '_call_script';
    script.textContent = 'Please oppose CISA, the Cybersecurity Information Sharing Act. CISA won\'t fix cybersecurity. It will only lead to more warrantless mass-surveillance of innocent Americans. We need real cybersecurity and it\'s not CISA.';
    div.appendChild(script);

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