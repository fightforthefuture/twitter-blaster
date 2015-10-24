var config  = require('nconf');
config.argv().env().file({file: __dirname + '/config.json'});

var gm      = require('gm').subClass({imageMagick: true});
var fs      = require('fs');
var sha1    = require('node-sha1');

var processImageData = function(data, callback) {
    var filename = 'tmp/'+sha1(new Date().getTime()+'_'+Math.random())+'.png';

    var buffer = new Buffer(data, 'base64');
    console.log('writing temporary file '+filename+'...');
    fs.writeFile(filename, buffer, 'ascii', function(err, data) {

        if (err)
            return callback(err, null);

        console.log('wrote temporary file '+filename+'.');
        processImageFile(filename, callback);
    });
};

var processImageFile = function(filename, callback) {
    console.log('processing uploaded file ' + filename + '...');
    var outputFile = 'tmp/'+sha1(new Date().getTime()+'_'+Math.random())+'.png';

    gm(filename)
        .autoOrient()
        .resize(config.get('IMG_WIDTH'), config.get('IMG_HEIGHT'), '^')
        .gravity('Center')
        .crop(config.get('IMG_WIDTH'), config.get('IMG_HEIGHT'))
        .write(outputFile, function(err) {
            if (err) {
                return callback(err, null);
            }
            callback(null, outputFile);
        });
};

var getClientIp = function(req) {
    var ipAddress;
    var forwardedIpsStr = req.header('x-forwarded-for'); 
    if (forwardedIpsStr) {
        var forwardedIps = forwardedIpsStr.split(',');
        ipAddress = forwardedIps[0];
    }
    if (!ipAddress)
        ipAddress = req.connection.remoteAddress;
    return ipAddress;
};

var downloadFile = function(url, path, callback) {
    var request = require('request');
    request({uri: url}).pipe(fs.createWriteStream(path)).on('close', function(){
        callback(path);
    });
};

module.exports = {
    processImageData: processImageData,
    processImageFile: processImageFile,
    getClientIp:      getClientIp,
    downloadFile:     downloadFile
}