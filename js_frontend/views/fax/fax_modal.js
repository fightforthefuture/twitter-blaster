var FaxModalView = function(data) {
    var div = $c('div');
    div.className = 'modal _fax_modal';

    var a = $c('a');
    a.className = 'close';
    a.textContent = '×';
    a.href = '#';
    div.appendChild(a);

    var top = $c('div');
    top.className = '_fax_top';

    var h2 = $c('h2');
    if (data.fax._is_new || data.fax.edit_token)
        h2.textContent = 'We\'re sending your fax to Congress!';
    else
        h2.textContent = 'We\'re sending this fax to Congress!';
    top.appendChild(h2);

    var p = $c('p');

    var em = $c('em');
    em.textContent = 'Help us stop Congress from wrecking online privacy.';

    if (!data.fax.edit_token) {
        p.appendChild(em);
    }

    if (data.fax.edit_token || data.fax._is_new) {
        var span = $c('span');
        span.textContent = ' Please share your fax, and donate if you can!';
        p.appendChild(span);
    } else {
        var a = $c('a');
        a.href = '#';
        a.className = '_fax_send';
        a.textContent = 'Click here to send a fax.';
        p.appendChild(a);
    }

    top.appendChild(p);

    var a = $c('a');
    a.className = 'social twitter';
    a.href = '#';
    a.textContent = 'Tweet this';
    top.appendChild(a);

    var a = $c('a');
    a.className = 'social facebook';
    a.href = '#';
    a.textContent = 'Share this';
    top.appendChild(a);

    var a = $c('a');
    a.className = 'social donate';
    a.href = 'https://donate.fightforthefuture.org?amount=5';
    a.textContent = 'Donate $5';
    a.target = '_blank';
    top.appendChild(a);

    div.appendChild(top);

    if (data.fax.edit_token) {
        var editOptions = $c('div');
        editOptions.className = '_fax_edit_options';

        if (data.fax.edit_token && !data.fax._is_new) {
            var a = $c('a');
            a.className = '_fax_edit';
            a.href = '#';
            var strong = $c('strong');
            strong.textContent = 'Click here to edit your Fax...';
            a.appendChild(strong);
            editOptions.appendChild(a);
            var span = $c('span');
            editOptions.appendChild(span);
            div.appendChild(editOptions);
        } else if (!data.user.social_user_id) {
            var a = $c('a');
            a.className = '_fax_add_twitter';
            a.href = '#';
            var span = $c('span');
            span.textContent = 'Add your Twitter profile to your fax!';
            a.appendChild(span);
            editOptions.appendChild(a);
            div.appendChild(editOptions);
        }        
    }
    var page = $c('div');
    page.className = '_fax_page';

    var a = $c('a');
    a.className = '_fax_image';
    a.style.backgroundImage='url(/fax/'+data.fax.access_token+'/image.png)';
    a.style.backgroundSize = '100% 100%';
    a.href = '/fax/'+data.fax.access_token+'/image.png';
    a.target = '_blank';

    var spinner = util.generateSpinner();
    page.appendChild(spinner);

    page.appendChild(a);

    var promo = $c('div');
    promo.className = '_fax_promo';
    var span = $c('span');
    span.textContent = 'Faxes powered by ';
    promo.appendChild(span);
    var a = $c('a');
    a.href = 'https://www.faxrobot.com';
    a.target = '_blank';
    a.textContent = 'Fax Robot';
    promo.appendChild(a);
    var span = $c('span');
    span.textContent = ' and ';
    promo.appendChild(span);
    var a = $c('a');
    a.href = 'https://www.fightforthefuture.org';
    a.target = '_blank';
    a.textContent = 'Fight for the Future';
    promo.appendChild(a);
    page.appendChild(promo);

    div.appendChild(page);

    return div;
}