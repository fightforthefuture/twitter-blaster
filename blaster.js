var FAIL_WAIT       = 2000;
var POLL_INTERVAL   = 3000;
var MAX_POLLS       = 40;
var PHAXIO_INTERVAL = 334;
var PHAXIO_TIMEOUT  = 5000;
var PHANTOM_INTERVAL= 100;
var BENCHMARK_NUM   = '8574884063';
var TEST_IMG        = 'https://images.cispaisback.org/faxes/04c625873d599d99a735a7b8718bb3b12bbd8748.png';

var config  = require('nconf');
config.argv().env().file({file: __dirname + '/config.json'});

var fs              = require('fs')
var sha1            = require('node-sha1');
var request         = require('request');

var util            = require('./util');
var models          = require('./models');
var sequelize       = models.sequelize;
var User            = models.User;
var Fax             = models.Fax;
var Target          = models.Target;
var Outgoing        = models.Outgoing;

var targets         = null;
var targetId        = -1;
var interrupt       = false;
var provider        = 'PHANTOM';

var prompt          = require('prompt');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

console.log('Starting Fax Blaster...');

var error = function(err) {
    console.log('ERROR: ', err);
    console.log('Robo-Cheney says "go fuck yourself :)"');
    process.exit(1)
}

prompt.start({noHandleSIGINT: true});

process.on('SIGINT', function() {
    console.log("-- CAUGHT INTERRUPT SIGNAL. Will stop operation when safe.");

    interrupt = true;
});

var selectProvider = function() {
    prompt.get(
        {
            properties: {
                provider: {
                    description:'Choose service (FAXROBOT | PHAXIO | [PHANTOM])'
                }
            }
        },
        function(err, result) {
            
            if (result.provider)
                provider = result.provider.toUpperCase();
            
            chooseFilter();            
        }
    );
};


var chooseFilter = function() {
    prompt.get(
        {
            properties: {
                filter: {
                    description: 'Enter a targeting filter (optional)',
                    required: false
                }
            }
        },
        function(err, result) {

            if (err) return error(err);

            if (result.filter.toLowerCase() == 'benchmark')
                return doBenchmark();

            if (result.filter)
                var filter = {where: {tag: result.filter, disabled: 0}};
            else
                var filter = {where: {disabled: 0}};

            Target.findAndCountAll(filter).then(function(filterResult) {
                if (filterResult.count == 0) {
                    console.log('ERROR: No matching targets :(');
                    return chooseFilter();
                }
                targets = filterResult.rows;
                selectTarget();
            });

            console.log(result.filter);
        }
    );
};

var selectTarget = function() {
    for (var i = 0; i < targets.length; i++) {

        if (targets[i].id < 10)
            var strId = targets[i].id+'  ';
        else if (targets[i].id < 100)
            var strId = targets[i].id+' ';
        else
            var strId = targets[i].id;
        
        console.log('['+strId+']: '+targets[i].name);
    }
    prompt.get(
        {
            properties: {
                targetId: {
                    description: 'Enter target ID',
                    required: true,
                    pattern: /^[0-9]+$/,
                }
            }
        },
        function(err, result) {

            if (err) return error(err);

            var testId = parseInt(result.targetId);

            var found = getTargetById(testId);

            if (!found) {
                console.log('ERROR: Target does not exist. Please try again.');
                return selectTarget();
            }
            console.log('Target: ', found.name, ' / ', found.bioguide_id);

            targetId = testId;
            selectTargetMode();
        }
    );
};

var selectTargetMode = function() {

    prompt.get(
        {
            properties: {
                targetMode: {
                    description: 'Choose targeting mode ([SPREAD] | SINGLE)'
                }
            }
        },
        function(err, result) {
            
            if (result.targetMode)
                var mode = result.targetMode.toUpperCase();
            else
                var mode = 'SPREAD';

            if (mode != 'SPREAD' && mode != 'SINGLE'){
                console.log('ERROR: Unsupported targeting mode.');
                return selectTargetMode();
            }

            if (mode == 'SPREAD')
                targetSpread();
            else if (mode == 'SINGLE')
                targetSingle();
        }
    );
}

var doBenchmark = function() {

    console.log('Top secret benchmarking feature selected.');

    prompt.get(
        {
            properties: {
                faxId: {
                    description: 'Enter Fax ID to benchmark on:',
                    required: true,
                }
            }
        },
        function(err, result) {

            if (err) return error(err);

            Fax.findById(result.faxId).then(function(fax) {
                if (!fax) {
                    console.log('Fax not found lol');
                    return doBenchmark();
                }

                var loop = function() {
                    if (interrupt)
                        return die();

                    var target = {
                        id: -1,
                        name: '(benchmark)',
                        fax_number: BENCHMARK_NUM
                    };
                    sendFaxToTarget(fax, target, loop);
                }
                loop();

            });
        }
    );

};

var targetSpread = function() {
    console.log('Spread mode activated!');

    var hitIndex = -1;
    var hitList  = [];

    for (var i = 0; i < targets.length; i++) {

        if (targets[i].id == targetId)
            hitIndex = i;

        if (hitIndex != -1)
            hitList.push(targets[i]);
    }
    
    for (var i = 0; i < hitIndex; i++)
        hitList.push(targets[i]);

    var i = 0;

    var faxComplete = function() {
        if (interrupt)
            return die();

        i++;
        if (i == hitList.length)
            i = 0;

        return grabNextFax(hitList[i], faxComplete);
    }

    grabNextFax(hitList[i], faxComplete);
};

var targetSingle = function() {
    console.log('Single target mode activated!');

    var target = getTargetById(targetId);

    var faxComplete = function() {
        if (interrupt)
            return die();

        return grabNextFax(target, faxComplete);
    }

    grabNextFax(target, faxComplete);
};

var grabNextFax = function(target, callback) {
    console.log('Grabbing next fax from database...');

    sequelize.query(
        "SELECT     f.id, f.image_url, f.email, f.body, f.started, u.name      "
      + "FROM       "+config.get("TBL_PREFIX")+"fax f                          "
      + "LEFT JOIN  "+config.get("TBL_PREFIX")+"outgoing o                     "
      + "ON         f.id = o.fax_id                                            "
      + "AND        o.target_id = "+target.id+"                                "
      + "INNER JOIN "+config.get("TBL_PREFIX")+"user u                         " //
      + "ON         u.social_user_id = f.social_user_id                        " //
      + "WHERE      o.id IS NULL                                               "
      + "AND        f.email IS NOT NULL                                        " //
      + "LIMIT      1                                                          "
      , { raw: true, type: sequelize.QueryTypes.SELECT }
    ).then(function(result) {

        if (!result || result.length == 0) {
            console.log('No record found! Trying again in 5s...');
            return setTimeout(callback, 5000);
        }

        console.log('Found Fax ID: ', result[0].id, '; Target ID: ', target.id);
        // return callback();

        if (result[0].started == 0)
            startFax(result[0], function(fax) {
                if (provider != 'PHANTOM')
                    sendFaxToTarget(fax, target, callback);
                else
                    emailFaxToTarget(fax, target, callback);
            });
        else
            if (provider != 'PHANTOM')
                sendFaxToTarget(result[0], target, callback);
            else
                emailFaxToTarget(result[0], target, callback);
    })/*.catch(function(err) {
        console.log('OMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOM');
        console.log('GOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGO');
        console.log('MGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOMGOOM');
        console.log('OMG DATABASE FAIL: ', err);
        callback();
    });*/
}

var startFax = function(fax, callback) {

    console.log('Marking fax '+fax.id+' as started...');

    Fax.update(
        {
            email:      '[REDACTED]',
            started:    1,
            start_date: sequelize.fn('NOW'),
            mod_date:   sequelize.fn('NOW')
        },
        { where: { id : fax.id }}
    ).then(function(res) {
        callback(fax);
    });
}

var emailFaxToTarget = function(fax, target, callback) {
    console.log('email '+fax.id+'/'+fax.name+' to '+target.name+' ('+target.fax_number+')');

    var failed = function(err, failCode) {
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log('FAX FAILED: ', err);

        setTimeout(function() {
            callback();
        }, PHANTOM_INTERVAL);
        
    }

    // make sure an email is set up
    if (!fax.email || fax.email == '[REDACTED]')
        fax.email = 'info@fightforthefuture.org';

    // massage address2 into zip code
    var zip = target.address2.trim().match(/[\d-]+$/);
    zip = zip[0];
    if (zip.indexOf('-') != -1)
        zip = zip.substr(0, 5);

    var completed = false;

    var phantom_request = {
        api_key:            config.get('PHANTOM_API_KEY'),
        name:               fax.name,
        address1:           target.address1,
        zip:                zip,
        email:              fax.email,
        message:            fax.body,
        subject:            'Stop CISA!',
        uid:                fax.id,
        tag:                'faxbigbrother',
        topics:             'telecommunications,privacy,civil liberties',
        bioguide_id:        target.bioguide_id
    }
    
    request.post({
        url: 'https://phantom-dc-extras.herokuapp.com/congress/submit',
        formData: phantom_request
    },    
    function(err, httpResponse, body) {

        completed = true;

        if (err || httpResponse.statusCode != 200)
            return failed(body || err);

        try {
            var job = JSON.parse(body);

            console.log('Got Phantom response: ', job);

            var outgoing = {
                fax_id:             fax.id,
                target_id:          target.id,
                target_name:        target.name,
                target_fax_number:  target.fax_number,
                status:             'queued',
                attempts:           1,
                create_date:        sequelize.fn('NOW'),
                emailed:            1,
                phantom_dc_ref_id:  job.ref_id
            };
            Outgoing.create(outgoing).then(function(outgoing) {
                setTimeout(function() {
                    callback();
                }, PHANTOM_INTERVAL);
            });

        } catch(err) {
            console.log('COULD NOT PARSE PHANTOM RESPONSE OMG WTF');
            return failed(err);
        }

        

        
    });
    setTimeout(function() {
        if (!completed)
            return failed('PHANTOM TIMEOUT');
    }, PHAXIO_TIMEOUT);
    
}

var sendFaxToTarget = function(fax, target, callback) {

    console.log('faxing '+fax.id+' to '+target.name+' ('+target.fax_number+')');

    var outgoing = {
        fax_id:             fax.id,
        target_id:          target.id,
        target_name:        target.name,
        target_fax_number:  target.fax_number,
        status:             'started',
        attempts:           1,
        create_date:        sequelize.fn('NOW')
    };
    Outgoing.create(outgoing).then(function(outgoing) {

        var failed = function(err, failCode) {
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            console.log('FAX FAILED: ', err);

            var failInfo = {
                status:     'failed',
                mod_date:   sequelize.fn('NOW'),
                fail_date:  sequelize.fn('NOW'),
                debug:      err,
            } 
            if (failCode)
                failInfo.fail_code = failCode;

            outgoing.updateAttributes(failInfo).then(function() {
                console.log('Logged failure. Waiting '+FAIL_WAIT+'ms...');
                setTimeout(function() {
                    callback();
                }, FAIL_WAIT);
            });
        }

        var filename = 'tmp/' + sha1(Math.random()+'trololol') + '.png';

        downloadAndAddress(fax.image_url, filename, target, function(err, file){

            if (err)
                return failed('FILESYSTEM ERROR');

            var startTime = new Date().getTime();

            if (provider == 'FAXROBOT') {

                var job = {
                    api_key:            config.get('FAXROBOT_API_KEY'),
                    send_authorized:    1,
                    file:               fs.createReadStream(filename),
                    destination:        target.fax_number.trim(),
                    // destination:        6125454384   // JL
                    //destination:        8574884063      // FFTF
                }
                request.post({
                    // JL HACK ~ workaround insanely ridiculous node.js bug.
                    url: 'https://api.faxrobot.com/jobs/create',
                    //url: 'https://173.165.253.181/jobs/create',
                    formData: job
                },
                function(err, httpResponse, body) {

                    if (err || httpResponse.statusCode != 200)
                        return failed(body || JSON.stringify(err));

                    var job = JSON.parse(body);
                    var key = job.access_key;

                    console.log('got Fax Robot job: ', job.access_key);

                    outgoing.updateAttributes({
                        faxrobot_job_id:            job.id.toString(),
                        faxrobot_job_access_key:    job.access_key,
                    });

                    var polls = 0;
                    var isPolling = 0;

                    console.log('polling job status...');

                    var poll = setInterval(function() {
                        polls++;
                        if (polls == MAX_POLLS) {
                            clearInterval(poll);
                            return failed('FAX ROBOT SEND TIMEOUT');
                        }
                        if (isPolling) {
                            console.log('Waiting for last poll to complete...');
                            return false;
                        }

                        // JL HACK ~ workaround insanely ridiculous node.js bug.
                        var url = 'https://api.faxrobot.com/jobs/get/'+key
                        // var url = 'https://173.165.253.181/jobs/get/'+key
                                + '?api_key='+config.get('FAXROBOT_API_KEY');

                        isPolling = 1;

                        request(url, function(err, httpResponse, body) {
                            isPolling = 0;
                            if (err || httpResponse.statusCode != 200) {
                                clearInterval(poll);
                                return failed(body || JSON.stringify(err));
                            }
                            var job = JSON.parse(body);

                            console.log('job '+key+' is: ', job.status);

                            if (job.status == 'failed') {

                                clearInterval(poll);
                                return failed('FAXROBOT FAIL', job.fail_code);

                            } else if (job.status == 'sent') {

                                clearInterval(poll);

                                var endTime = new Date().getTime();
                                var seconds = (endTime - startTime) / 1000;

                                outgoing.updateAttributes({
                                    status:         'sent',
                                    mod_date:       sequelize.fn('NOW'),
                                    complete_date:  sequelize.fn('NOW'),
                                    send_time:      parseInt(seconds)
                                }).then(function() {

                                    console.log('JOB FINISHED IN '+seconds+'s');
                                    console.log('----------------------------');
                                    fs.unlink(filename);
                                    incrementTargetSentCount(target.id);
                                    callback();
                                });
                            }
                        });

                    }, POLL_INTERVAL);
                });

            } else if (provider == 'PHAXIO') {
                var job = {
                    api_key:            config.get('PHAXIO_API_KEY'),
                    api_secret:         config.get('PHAXIO_API_SECRET'),
                    filename:           fs.createReadStream(filename),
                    'tag[outgoing_id]': outgoing.id,
                    to:                 target.fax_number.trim(),
                    // to:        6125454384   // JL
                    // to:        8574884063      // FFTF
                }
                var startTime = new Date().getTime();

                var completed = false;

                request.post({
                    url: 'https://api.surge.phaxio.com/v1/send',
                    formData: job
                },
                function(err, httpResponse, body) {

                    completed = true;

                    if (err || httpResponse.statusCode != 200)
                        return failed(body || err);

                    var job = JSON.parse(body);

                    console.log('Got Phaxio job: ', job);

                    outgoing.updateAttributes({ phaxio_fax_id: job.faxId });

                    var endTime = new Date().getTime();

                    if (endTime - startTime < PHAXIO_INTERVAL)
                        setTimeout(function() {
                            callback();
                        }, PHAXIO_INTERVAL - (endTime - startTime));
                    else
                        callback();
                });
                setTimeout(function() {
                    if (!completed)
                        return failed('PHAXIO TIMEOUT');
                }, PHAXIO_TIMEOUT);
            }
        });
    });
};

var getTargetById = function(id) {
    for (var i = 0; i < targets.length; i++)
        if (targets[i].id == id)
            return targets[i];
}

var incrementTargetSentCount = function(id) {
    sequelize.query(
        "UPDATE     "+config.get("TBL_PREFIX")+"target                         "
      + "SET        num_sent = num_sent + 1                                    "
      + "WHERE      id = "+id+"                                                "
    )
}

var die = function() {
    console.log('Bye.');
    process.exit();
}

var downloadAndAddress = function(url, path, target, callback) {
    var Canvas = require('canvas');
    var Image = Canvas.Image;
    var canvas = new Canvas(1700, 2200);
    var ctx = canvas.getContext('2d');

    util.downloadFile(url, path, function(filename) {
        
        fs.readFile(filename, function(err, letter) {
            if (err)
                return callback(err, null);

            try{

                var img = new Image;
                img.src = letter;
                ctx.drawImage(img, 0, 0, 1700, 2200);

                var font_size = 30;
                var lineHeight = 36;

                ctx.font = "bold " + font_size + "px Courier New";

                ctx.fillText("The Hon. " + target.name, 1050, 180);

                ctx.font = font_size + "px Courier New";

                ctx.fillText(target.address1, 1050, 220);
                ctx.fillText(target.address2, 1050, 260);

                var buff  = canvas.toBuffer();

                fs.writeFile(filename, buff, 'ascii', function(err, data) {

                    callback(null, filename);
                });

                
            } catch(err) {
                return callback(err, null);
            }
        });
    });
};

selectProvider();




/*
var target = {
    id: -1,
    name: 'Shelley Moore Capito',
    fax_number: BENCHMARK_NUM,
    address1: '123 main street',
    address2: 'boston ma 05537'
};
downloadAndAppendAddress(TEST_IMG, 'tmp/test.png', target, function() {
    console.log('done!');
});
*/