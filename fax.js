var config  = require('nconf');
config.argv().env().file({file: __dirname + '/config.json'});

var fs      = require('fs');

var sanitizeFaxData = function(fax, keepEditToken) {
    return {
        id:             fax.id,
        body:           fax.body,
        access_token:   fax.access_token,
        edit_token:     keepEditToken ? fax.edit_token : null,
    }
}

var populateDefaultFax = function(data, callback) {
    fs.readFile('resources/default_fax.txt', function(err, text) {
        if (err)
            callback(err, null);

        data.body = text.toString();
        data.user_name = 'Anonymous';

        if (data.purpose_user_id) {

            var request = require('request');

            var url = config.get('MOTHERSHIP_API_URL')+'/get_purpose_user'
                    + '?user_id='+data.purpose_user_id
                    + '&key='+config.get('MOTHERSHIP_ACCESS_KEY')

            request.get(url, function (err, res, body) {

                if (err || res.statusCode != 200)
                    return callback('Failed to locate user', null);

                try {
                    var user = JSON.parse(body);

                    if (user.first_name && user.last_name)
                        data.user_name = user.first_name + ' ' + user.last_name;
                    else if (user.first_name)
                        data.user_name = user.first_name;                    

                    data.email = user.email;
                    data.postal_code = user.postal_code;
                    data.body += data.user_name;

                    callback(null, null);
                    
                } catch (err) {
                    return callback('Failed to locate user', null);
                }
            });

        } else {
            
            callback(null, null);
        }
    });
};

var wrapText = function(ctx, text, x, y, maxWidth, lineHeight, maxHeight) {
    var words = text.split(' ');
    var line = '';

    for(var n = 0; n < words.length; n++) {
        if (line.indexOf('\n') != -1) {
            var sp = line.split('\n');
            for (var m = 0; m < sp.length; m++) {
                if (m != sp.length - 1 && line.charAt(line.length) != '\n') {
                    ctx.fillText(sp[m], x, y);
                    y += lineHeight;
                    if (maxHeight && y > maxHeight) {
                        line ='...';
                        break;
                    }
                }
            }
            if (line.charAt(line.length) != '\n')
                line = sp[m-1] + words[n] + ' ';
            else
                line = words[n] + ' ';

            continue;
        }
        if (maxHeight && y > maxHeight) {
            line ='...';
            break;
        }
        var testLine = line + words[n] + ' ';
        var metrics = ctx.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            y += lineHeight;

            line = words[n] + ' ';
        }
        else
            line = testLine;
    }
    ctx.fillText(line, x, y);
}

var generate = function(data, user, photoFilename, callback) {
    var Canvas = require('canvas');
    var Image = Canvas.Image;
    var canvas = new Canvas(1700, 2200);
    var ctx = canvas.getContext('2d');

    var generateImage = function(err, avatarImgBuffer) {
        fs.readFile('resources/lettertemplate.png', function(err, letter) {
            if (err)
                return callback(err, null, null, null);

            try{

                var img = new Image;
                img.src = letter;
                ctx.drawImage(img, 0, 0, 1700, 2200);

                var av = new Image;
                av.src = avatarImgBuffer;
                ctx.drawImage(av, 150, 150, 130, 130);

                var font_size = 30;
                var lineHeight = 36;

                ctx.font = "bold " + font_size + "px Courier New";

                if (user && user.name)
                    var username = user.name;
                else if (data.user_name)
                    var username = data.user_name;
                else
                    var username = 'a concerned individual';

                ctx.fillText("Submitted by " + username, 315, 180);

                ctx.font = font_size + "px Courier New";

                if (data.email)
                    var email = data.email;
                else 
                    var email = 'No email address provided';

                ctx.fillText(email, 315, 220);

                if (user && user.username)
                    var username = '@'+user.username;
                else 
                    var username = 'No Twitter account specified';

                ctx.fillText(username, 315, 260);

                ctx.font = "bold " + font_size + "px Courier New";

                var maxWidth = 1400;
                var x = (canvas.width - maxWidth) / 2;
                var y = 420;

                if (photoFilename)
                    var maxY = 1300;
                else
                    var maxY = 1900;

                y = wrapText(ctx, data.body, x, y, maxWidth, lineHeight, maxY);

                var finalize = function(err, photoBuffer) {
                    if (err)
                        return callback(err, null, null, null);
                    
                    if (photoBuffer) {
                        var photoImg    = new Image;
                        var width       = config.get('IMG_WIDTH');
                        var height      = config.get('IMG_HEIGHT');
                        photoImg.src    = photoBuffer;
                        ctx.drawImage(photoImg, 150, 1340, width, height);
                    }

                    var buff  = canvas.toBuffer();

                    var fax = {
                        body:               data.body,
                        ip_address_hashed:  data.ip_address_hashed,
                        started:            0
                    };

                    if (user && user.social_user_id)
                        fax.social_user_id = user.social_user_id;

                    if (data && data.email)
                        fax.email = data.email;

                    if (data && data.tag)
                        fax.tag = data.tag;

                    callback(null, fax, buff, photoFilename);
                };

                if (photoFilename)
                    fs.readFile(photoFilename, function(err, photo) {
                        finalize(err, photo);
                    });
                else
                    finalize(null, null)
            } catch(err) {
                return callback(err, null, null, null);
            }        
        });
    };

    if (user && user.avatar_url_s3) {
        var request = require('request').defaults({ encoding: null });
        request.get(user.avatar_url_s3, function (err, res, body) {
            generateImage(err, body);
        });
    } else {
        fs.readFile('resources/anonymous2.png', function(err, avatar) {
            generateImage(err, avatar);
        });
    }
};

var renderRedacted = function(imageUrl, callback) {
    var request = require('request').defaults({ encoding: null });
    request(imageUrl, function (err, response, body) {
        if (err || response.statusCode != 200)
            return callback(err || response.statusCode, null);

        var Canvas = require('canvas');
        var Image = Canvas.Image;
        var canvas = new Canvas(1700, 2200);
        var ctx = canvas.getContext('2d');

        var img = new Image;
        img.src = body;
        ctx.drawImage(img, 0, 0, 1700, 2200);

        fs.readFile('resources/redacted.png', function(err, redact) {
            if (err)
                return callback(err, null)

            var img2 = new Image;
            img2.src = redact;
            ctx.drawImage(img2, 0, 0, 1700, 2200);

            buffer = canvas.toBuffer();

            callback(null, buffer)
        });
    });
};

module.exports = {
    sanitizeFaxData:     sanitizeFaxData,
    populateDefaultFax:  populateDefaultFax,
    generate:            generate,
    renderRedacted:      renderRedacted
}