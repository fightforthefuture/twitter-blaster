var FaxComposerFormView = function(data) {
    var container = $c('div');
    container.className = '_fax_form';
    container.id = '_fax_form';

    /*
    var user = $c('div');
    user.className = '_fax_user';

    var avatar = $c('div');
    avatar.className = '_fax_avatar';
    avatar.style.backgroundImage = 'url('+this.defaultAvatarUrl+')';
    avatar.style.backgroundSize = '100% auto';
    var logout = $c('a');
    logout.className = '_fax_logout';
    logout.href = '#';
    logout.textContent = 'LOG OUT';
    avatar.appendChild(logout);
    
    user.appendChild(avatar);

    var login = $c('a');
    login.className = '_fax_login';
    login.href = '#';
    login.textContent = 'LOG IN';
    user.appendChild(login);

    container.appendChild(user);
    */

    var body = $c('div');
    body.className = '_fax_body';

    var textarea = $c('textarea');
    textarea.value = data.defaultText;
    body.appendChild(textarea);

    var controls = $c('div');
    controls.className = '_fax_controls';

    var button = $c('a');
    button.className = '_fax_photo';
    var glyph = $c('i');
    glyph.className = 'fa fa-camera';
    button.appendChild(glyph);
    var text = $c('span');
    text.textContent = 'Add photo';
    button.appendChild(text);
    var ul = $c('ul');
    var li1 = $c('li');
    var a1 = $c('a');
    a1.className = '_fax_webcam';
    a1.href = '#';
    a1.textContent = 'From webcam';
    li1.appendChild(a1);
    ul.appendChild(li1);
    var li2 = $c('li');
    var a2 = $c('a');
    a2.className = '_fax_file';
    a2.href = '#';
    a2.textContent = 'Attach file';
    li2.appendChild(a2);
    // ul.addEventListener('mouseleave', this.hidePhotoMenu.bind(this));
    ul.appendChild(li2);
    button.appendChild(ul);

    controls.appendChild(button);

    var preview = $c('div');
    preview.className = '_fax_preview';
    var x = $c('a');
    x.textContent = '×';
    x.href = '#';
    preview.appendChild(x);
    controls.appendChild(preview);

    var file = $c('input');
    file.type = 'file';
    controls.appendChild(file);

    var right = $c('div');
    right.className = '_fax_right';

    var input = $c('input');
    input.type = 'text';
    input.className = '_fax_email';
    input.placeholder = 'Your email (optional)';
    input.name = 'email';
    right.appendChild(input);

    var button = $c('button');
    button.className = '_fax_submit';
    
    var glyph = $c('i');
    glyph.className = 'fa fa-fax';
    button.appendChild(glyph);
    var text = $c('span');
    text.textContent = 'Fax now';
    button.appendChild(text);
    
    var spinner = util.generateSpinner();
    button.appendChild(spinner);

    right.appendChild(button);
    controls.appendChild(right);

    /*
    var input = $c('input');
    input.type = 'text';
    input.className = '_fax_zip';
    input.placeholder = 'Your zip code';
    input.name = 'zip';
    controls.appendChild(input);
    */

    body.appendChild(controls);
    container.appendChild(body);

    var thanks = $c('div');
    thanks.className = '_fax_thanks';

    var h1 = $c('h1');
    h1.textContent = 'Thanks for faxing! You rock!';
    thanks.appendChild(h1);

    var p = $c('p');
    p.textContent = 'Help us keep up the momentum! Please share this page.';
    thanks.appendChild(p);        

    var a = $c('a');
    a.className = 'social twitter';
    a.href = '#';
    a.textContent = 'Tweet this';
    thanks.appendChild(a);

    var a = $c('a');
    a.className = 'social facebook';
    a.href = '#';
    a.textContent = 'Share this';
    thanks.appendChild(a);

    var a = $c('a');
    a.className = 'social donate';
    a.href = 'https://donate.fightforthefuture.org?amount=5';
    a.textContent = 'Donate $5';
    a.target = '_blank';
    thanks.appendChild(a);

    container.appendChild(thanks);
    return container;
}