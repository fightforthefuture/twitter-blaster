var config  = require('nconf');
config.argv().env().file({file: __dirname + '/config.json'});

var async           = require('async');
var stream          = require('stream');
var fs              = require('fs');
var express         = require('express');
var session         = require('express-session');
var RedisStore      = require('connect-redis')(session);
var cookieParser    = require('cookie-parser');
var bodyParser      = require('body-parser');
var passport        = require('passport');
var util            = require('util');
var multiparty      = require('multiparty');
var TwitterStrategy = require('passport-twitter').Strategy;
var fs              = require('fs');
var template        = require('swig');
var sha1            = require('node-sha1');
var aws             = require('aws-sdk');
var moment          = require('moment');
var request         = require('request');

var FaxHandler      = require('./fax');
var util            = require('./util');
var models          = require('./models');
var sequelize       = models.sequelize;
var User            = models.User;
var Fax             = models.Fax;
var Outgoing        = models.Outgoing;
var FOIA            = models.FOIA;

template.setDefaults({
    cache: false,   // JL DEBUG ~ turn off template caching.
    autoescape: false
});

aws.config.update({
    accessKeyId: config.get('AWS_ACCESS_KEY'),
    secretAccessKey: config.get('AWS_SECRET_KEY')
})

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new TwitterStrategy(
    {
        consumerKey: config.get('TWITTER_CONSUMER_KEY'),
        consumerSecret: config.get('TWITTER_CONSUMER_SECRET'),
        callbackURL: config.get('BASE_URL') + "/auth/twitter/callback"
    },
    function(token, tokenSecret, profile, done) {

        var token = sha1(Math.random().toString() + config.get('TOKEN_SALT'));

        var data = {
            social_user_id: 'twitter_'+profile._json.id,
            username:       profile._json.screen_name,
            name:           profile._json.name,
            avatar_url:     profile._json.profile_image_url_https,
            mod_date:       sequelize.fn('NOW'),
            access_token:   token
        }
        User.upsert(data).then(function(created) {
            User.uploadAvatarS3(data, function(err, data) {

                if (err)
                    return console.log('FAILED UPLOAD USER AVATAR S3: ', err);

                console.log('Uploaded user avatar from S3!');
            });
            return done(null, data);
        });
    }
));

var app = express();
app.set('port', (process.env.PORT || 80));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended : true
}));
app.use(session({
    store: new RedisStore({
        host: config.get('REDIS_HOST'),
        port: config.get('REDIS_PORT'),
        pass: config.get('REDIS_PASS')
    }),
    secret: config.get('SESSION_SECRET'),
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));
app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'));
});

app.get('/auth/twitter', passport.authenticate('twitter'), function(req,res){});

app.get('/auth/twitter/callback', 
passport.authenticate('twitter', { failureRedirect: '/login' }),
    function(req, res) {
        var tmpl = template.compileFile('templates/auth_callback.html');
        res.send(tmpl({user: JSON.stringify(req.user)}));
    });

app.get('/', function(req, res) {
    var tmpl = template.compileFile('templates/button.html');
    res.send(tmpl({}));
});

app.get('/send', function(req, res) {
    var tmpl = template.compileFile('templates/send.html');
    res.send(tmpl({}));
});

app.post('/blast', function(req, res) {
    console.log('req: ', req.body);
    res.send('lol');
});

app.post('/fax', function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    var form = new multiparty.Form();
    form.parse(req, function(err, fields, files) {

        var error = function(err) {
            console.log('ERROR: ', err);
            res.json({error: 'An error occurred with your submission :('});
        }
        
        var createFax = function(err, photoFilename) {
            if (err)
                return error(err);

            if (data.social_user_id) {
                User.findOne({
                    where: {
                        social_user_id: data.social_user_id
                    }
                }).then(function(user) {
                    if (user)
                        FaxHandler.generate(data, user, photoFilename, saveFax);
                    else
                        FaxHandler.generate(data, null, photoFilename, saveFax);
                });
            } else {
                FaxHandler.generate(data, null, photoFilename, saveFax);
            }
        }

        var saveFax = function(err, fax, buff, file) {
            if (err)
                return error(err);

            Fax.uploadS3AndCreateInstance(fax, buff, file, function(err, fax) {
                if (err)
                    return error(err);

                console.log('new fax: ', FaxHandler.sanitizeFaxData(fax, true));
                return res.json(FaxHandler.sanitizeFaxData(fax, true));
            });
        }

        var data = { ip_address_hashed: sha1(util.getClientIp(req)) };

        for (var field in fields)
            if (fields.hasOwnProperty(field))
                data[field] = fields[field][0];

        if (data.purpose_user_id || data.autogenerate)
            FaxHandler.populateDefaultFax(data, createFax);
        else if (data.photo_data)
            util.processImageData(data.photo_data, createFax);
        else if (files && files.photo_file)
            util.processImageFile(files.photo_file[0].path, createFax);
        else
            createFax();

        if (data.edit_token)
            Fax.destroy({ where: { edit_token: data.edit_token, started: 0 }});
    });
});

app.get('/fax/:token', function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    Fax.findOne({where: {access_token: req.params.token}}).then(function(fax) {

        var access_token = '';

        if (fax)
            access_token = fax.access_token;

        var tmpl = template.compileFile('templates/index.html');
        res.send(tmpl({access_token: access_token}));
    });
});

app.get('/fax/:token/image.png', function(req, res) {
    var fetchError = function() {
        var img = fs.readFileSync('resources/404.png');
        res.writeHead(404, {'Content-Type': 'image/png' });
        res.end(img, 'binary');
    }
    Fax.findOne({where: {access_token: req.params.token}}).then(function(fax) {
        if (!fax)
            return fetchError();

        FaxHandler.renderRedacted(fax.image_url, function(err, buffer) {
            if (err)
                return fetchError();

            res.writeHead(200, {'Content-Type': 'image/png' });
            res.end(buffer, 'binary');
        });

    });
});

app.post('/fax/:token/addTwitter', function(req, res) {
    var form = new multiparty.Form();
    form.parse(req, function(err, fields, files) {

        var error = function(err) {
            console.log('ERROR: ', err);
            res.json({error: 'An error occurred. :('});
        }

        var data = {};

        for (var field in fields)
            if (fields.hasOwnProperty(field))
                data[field] = fields[field][0];

        User.findOne({
            where: {
                social_user_id: data.social_user_id
            }
        }).then(function(user) {
            if (!user)
                return error('User not found: '+ data.social_user_id);

            Fax.findOne({
                where: {
                    edit_token: data.edit_token
                }
            }).then(function(fax) {

                var saveFax = function(err, newFax, buff, file) {
                    if (err)
                        return error(err);

                    Fax.uploadS3(newFax, buff, file, function(err, newFax) {
                        if (err)
                            return error(err);

                        console.log('got updated fax, saving to db: ', newFax);

                        fax.updateAttributes({
                            image_url: newFax.image_url,
                            attachment_url: newFax.attachment_url
                        }).then(function(fax) {

                            return res.json(newFax.image_url);
                        });
                    });
                }

                if (!fax)
                    return error('Fax not found: '+ data.edit_token);

                if (!fax.attachment_url)
                    return FaxHandler.generate(fax, user, null, saveFax);

                var time = new Date().getTime();
                var file = 'tmp/'+sha1(time+'_'+Math.random())+'.png';

                util.downloadFile(fax.attachment_url, file, function(filename) {
                    FaxHandler.generate(fax, user, filename, saveFax)
                });
            });
        });
    });
});

