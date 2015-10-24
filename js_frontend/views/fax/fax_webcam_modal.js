var FaxWebcamModalView = function(data) {
    var container = $c('div');

    var flash = $c('div');
    flash.className = '_fax_flash';
    container.appendChild(flash);

    var div = $c('div');
    div.className = 'modal _fax_photo_modal';

    var a = $c('a');
    a.className = 'close';
    a.textContent = '×';
    a.href = '#';
    div.appendChild(a);
    
    var body = $c('div');
    body.className = '_fax_photo_modal_body';

    var videoContainer = $c('div');
    videoContainer.className = '_fax_video_container';
    var video = $c('video');
    video.id = '_fax_video';
    videoContainer.appendChild(video);
    var frame = $c('div');
    frame.className = '_fax_frame';
    videoContainer.appendChild(frame);
    body.appendChild(videoContainer);

    var canvas = $c('canvas');
    canvas.className = '_fax_canvas';
    body.appendChild(canvas);

    var photo = $c('img');
    photo.className = '_fax_photo';
    body.appendChild(photo);

    var controls = $c('div');
    controls.className = '_fax_photo_controls';

    var button1 = $c('button');
    button1.textContent = 'Take Photo';
    button1.className = '_fax_photo_take';
    controls.appendChild(button1);

    var button2 = $c('button');
    button2.textContent = 'Use Photo';
    button2.className = '_fax_photo_use';
    controls.appendChild(button2);

    var button3 = $c('button');
    button3.textContent = 'Retake Photo';
    button3.className = '_fax_photo_retake _fax_gray';
    controls.appendChild(button3);

    body.appendChild(controls);

    var audio = $c('audio');
    audio.preload = 'auto';
    var source1 = $c('source');
    source1.src = '/audio/photoShutter.mp3';
    source1.type = 'audio/mpeg';
    audio.appendChild(source1);
    var source2 = $c('source');
    source2.src = '/audio/photoShutter.ogg';
    source2.type = 'audio/ogg';
    audio.appendChild(source2);
    body.appendChild(audio);

    div.appendChild(body);
    container.appendChild(div);
    return container;
}