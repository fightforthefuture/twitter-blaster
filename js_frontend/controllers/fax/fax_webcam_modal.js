/**
    FaxWebcamModalController: Shows the webcam modal to take a photo
**/
var FaxWebcamModalController = BaseModalController.extend({
    events: {
        'click a.close': 'click_close',
        'click ._fax_photo_take': 'takePhoto',
        'click ._fax_photo_retake': 'resetPhoto',
        'click ._fax_photo_use': 'usePhoto'
    },

    elements: {
        'video': 'video',
        'canvas': 'canvas',
        '._fax_frame': 'frame',
        'audio': 'shutter',
        '._fax_flash': 'flash',
        '._fax_photo_take': 'take_photo',
        '._fax_photo_use': 'use_photo',
        '._fax_photo_retake': 'retake_photo',
        'img': 'photo'
    },

    width: 640,
    height: 0,
    streaming: false,
    streamRef: null,
    photoData: null,

    init: function() {
        this.render();
        this.show();
        setTimeout(function() {
            this.initializeWebcam();
        }.bind(this), 300);
    },

    render: function() {
        var overlay = this.base_render();

        overlay.firstChild.appendChild(FaxWebcamModalView());

        this.html(overlay);
    },

    initializeWebcam: function() {
        navigator.getMedia = (
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia
        );

        navigator.getMedia(
            {
                video: true,
                audio: false
            },
            function(stream) {
                this.streamRef = stream;
                if (navigator.mozGetUserMedia) {
                    this.video.mozSrcObject = stream;
                } else {
                    var vendorURL = window.URL || window.webkitURL;
                    this.video.src = vendorURL.createObjectURL(stream);
                }
                this.video.play();
            }.bind(this),
            function(err) {
                console.log("An error occured! " + err);
            }.bind(this)
        );

        this.video.addEventListener('canplay', function(ev){
            var video = this.video;

            if (!this.streaming) {
                this.height = video.videoHeight / (video.videoWidth/this.width);
                
                // Firefox bugfix
                if (isNaN(this.height)) this.height = this.width / (4/3);

                video.setAttribute('width', this.width);
                video.setAttribute('height', this.height);
                this.canvas.setAttribute('width', this.width);
                this.canvas.setAttribute('height', this.height);
                this.streaming = true;
            }
        }.bind(this), false);
    },

    before_hide: function() {
        if (this.streamRef) {
            this.streamRef.stop();
            this.streamRef = null;
        }
    },

    takePhoto: function() {
        if (!this.streaming)
            return this.initializeWebcam();

        var context = this.canvas.getContext('2d');
        if (!this.width || !this.height)
            return;

        this.canvas.width = this.width;
        this.canvas.height = this.height;
        context.drawImage(this.video, 0, 0, this.width, this.height);

        this.shutter.play();
        this.flash.style.display = 'block';
        setTimeout(function() {
            this.flash.style.display = 'none';
        }.bind(this), 2500);
        
        this.photoData = this.canvas.toDataURL('image/png');
        this.photo.setAttribute('src', this.photoData);

        this.video.style.display = 'none';
        this.photo.style.display = 'block';

        setTimeout(function() {
            this.take_photo.style.display = 'none';
            this.use_photo.style.display = 'inline-block';
            this.retake_photo.style.display = 'inline-block';
        }.bind(this), 125);
    },

    resetPhoto: function() {
        this.take_photo.style.display = 'inline-block';
        this.use_photo.style.display = 'none';
        this.retake_photo.style.display = 'none';
        this.video.style.display = 'block';
        this.photo.style.display = 'none';
    },

    usePhoto: function() {
        this.trigger('attach', this.photoData);
        this.hide();
    }
});