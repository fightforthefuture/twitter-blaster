var config  = require('nconf');
config.argv().env().file({file: __dirname + '/config.json'});

var sha1            = require('node-sha1');
var aws             = require('aws-sdk');
var fs              = require('fs');

aws.config.update({
    accessKeyId: config.get('AWS_ACCESS_KEY'),
    secretAccessKey: config.get('AWS_SECRET_KEY')
})

var Sequelize       = require('sequelize');

var sequelize = new Sequelize(
    config.get('DATABASE'),
    config.get('DB_USER'),
    config.get('DB_PASS'), {
        host:           config.get('DB_HOST'),
        port:           config.get('DB_PORT'),
        dialect:        'postgres',
        pool:           {
            maxConnections: 5,
            minConnections: 1,
            maxIdleTime: 10000
        },
        dialectOptions: {ssl: true},
        logging:        false,
    }
);

var User = sequelize.define('user',
    {
        social_user_id: {type: Sequelize.STRING, unique: true},
        username:       {type: Sequelize.STRING},
        name:           {type: Sequelize.STRING},
        avatar_url:     {type: Sequelize.STRING},
        avatar_url_s3:  {type: Sequelize.STRING},
        access_token:   {type: Sequelize.STRING},
        create_date:    {type: Sequelize.DATE},
        mod_date:       {type: Sequelize.DATE},
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: config.get('TBL_PREFIX') + 'user',
        classMethods: {
            uploadAvatarS3: function(userData, callback) {
                var request = require('request').defaults({ encoding: null });
                request.get(userData.avatar_url, function (err, res, body) {
                    if (err)
                        return callback(err, null);

                    var time = new Date().getTime();
                    var type = res.headers['content-type'];
                    var ext  = type.substr(type.indexOf('/') + 1);
                    var file = sha1(time + '-' + Math.random()) + '.' + ext;

                    var path = config.get('AWS_S3_AVATAR_FOLDER')+'/'+file;
                    var url  = 'https://'+config.get('AWS_S3_BUCKET')+'/'+path;

                    var s3   = new aws.S3();

                    var params = {
                        Bucket: config.get('AWS_S3_BUCKET'),
                        Key: path,
                        ACL: 'public-read',
                        Body: body,
                        ContentType: type
                    }                
                    s3.upload(params, function(err, res2) {
                        if (err)
                            return callback(err, null);
                    
                        userData.avatar_url_s3 = url;
                        User.upsert(userData).then(function(created2) {
                            callback(null, userData);
                        });
                    });
                });
            }
        }
    }
);

var Fax = sequelize.define('fax',
    {
        social_user_id:     {type: Sequelize.STRING},
        email:              {type: Sequelize.STRING},
        body:               {type: Sequelize.STRING},
        image_url:          {type: Sequelize.STRING},
        attachment_url:     {type: Sequelize.STRING},
        ip_address_hashed:  {type: Sequelize.STRING},
        postal_code:        {type: Sequelize.STRING},
        started:            {type: Sequelize.INTEGER},
        autogenerated:      {type: Sequelize.INTEGER},
        create_date:        {type: Sequelize.DATE},
        mod_date:           {type: Sequelize.DATE},
        start_date:         {type: Sequelize.DATE},
        access_token:       {type: Sequelize.STRING},
        edit_token:         {type: Sequelize.STRING},
        tag:                {type: Sequelize.STRING},
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: config.get('TBL_PREFIX') + 'fax',
        classMethods: {
            uploadS3AndCreateInstance: function(fax, buff, file, callback) {
                this.uploadS3(fax, buff, file, function(err, fax) {
                    if (err)
                        return callback(err, null);

                    console.log('uploaded to S3. saving database instace...');

                    var access = sha1(Math.random()+config.get('TOKEN_SALT'));
                    var edit   = sha1(Math.random()+config.get('TOKEN_SALT'));

                    fax.access_token = access;
                    fax.edit_token   = edit;

                    Fax.create(fax).then(function(fax) {
                        callback(null, fax);
                    });
                });
            },
            uploadS3: function(fax, buff, file, callback) {
                var time   = new Date().getTime();
                var rFile  = sha1(time+'_'+Math.random())+'.png';
                var path   = config.get('AWS_S3_FAX_FOLDER')+'/'+rFile;
                var url    = 'https://'+config.get('AWS_S3_BUCKET')+'/'+path;

                var rFile2 = sha1(time+'+'+Math.random())+'.png';
                var path2  = config.get('AWS_S3_PHOTO_FOLDER')+'/'+rFile2;
                var url2   = 'https://'+config.get('AWS_S3_BUCKET')+'/'+path2;

                var s3     = new aws.S3();                

                var params = {
                    Bucket: config.get('AWS_S3_BUCKET'),
                    Key: path,
                    ACL: 'public-read',
                    Body: buff,
                    ContentType: 'image/png'
                }

                console.log('fax image generated. uploading to Amazon S3...');
                
                s3.upload(params, function(err, fileData) {
                    if (err)
                        return callback(err, null);

                    fax.image_url = url;

                    if (!file)
                        return callback(null, fax);

                    console.log('fax has attachment. upload Amazon S3:', file);

                    fs.readFile(file, function (err, data) {
                        if (err)
                            return callback(err, null);

                        var buff2 = new Buffer(data, 'binary');

                        var params = {
                            Bucket: config.get('AWS_S3_BUCKET'),
                            Key: path2,
                            ACL: 'public-read',
                            Body: buff2,
                            ContentType: 'image/png'
                        }
                        s3.upload(params, function(err, fileData) {

                            fax.attachment_url = url2;
                            callback(null, fax);
                        });

                    });
                });
            }
        }
    }
);

var Target = sequelize.define('target',
    {
        name:               {type: Sequelize.STRING},
        fax_number:         {type: Sequelize.STRING},
        tag:                {type: Sequelize.STRING},
        num_sent:           {type: Sequelize.INTEGER},
        disabled:           {type: Sequelize.INTEGER},
        address1:           {type: Sequelize.STRING},
        address2:           {type: Sequelize.STRING},
        bioguide_id:        {type: Sequelize.STRING},
        create_date:        {type: Sequelize.DATE},
        mod_date:           {type: Sequelize.DATE},
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: config.get('TBL_PREFIX') + 'target'
    }
);

var Outgoing = sequelize.define('outgoing',
    {
        fax_id:                     {type: Sequelize.INTEGER},
        target_id:                  {type: Sequelize.INTEGER},
        target_name:                {type: Sequelize.STRING},
        target_fax_number:          {type: Sequelize.STRING},
        status:                     {type: Sequelize.STRING},
        attempts:                   {type: Sequelize.INTEGER},
        faxrobot_job_id:            {type: Sequelize.STRING},
        faxrobot_job_access_key:    {type: Sequelize.STRING},
        phaxio_fax_id:              {type: Sequelize.STRING},
        phaxio_error_type:          {type: Sequelize.STRING},
        phaxio_error_code:          {type: Sequelize.STRING},
        phantom_dc_ref_id:          {type: Sequelize.STRING},
        emailed:                    {type: Sequelize.INTEGER},
        debug:                      {type: Sequelize.STRING},
        fail_code:                  {type: Sequelize.INTEGER},
        create_date:                {type: Sequelize.DATE},
        mod_date:                   {type: Sequelize.DATE},
        fail_date:                  {type: Sequelize.DATE},
        complete_date:              {type: Sequelize.DATE},
        send_time:                  {type: Sequelize.INTEGER}
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: config.get('TBL_PREFIX') + 'outgoing'
    }
);

var FOIA = sequelize.define('foia',
    {
        first_name:         {type: Sequelize.STRING},
        last_name:          {type: Sequelize.STRING},
        email:              {type: Sequelize.STRING},
        street_address:     {type: Sequelize.STRING},
        postcode:           {type: Sequelize.STRING},
        city:               {type: Sequelize.STRING},
        state:              {type: Sequelize.STRING},
        ip:                 {type: Sequelize.STRING},
        subscribe:          {type: Sequelize.INTEGER},
        message:            {type: Sequelize.STRING},
        faxrobot_jobs:      {type: Sequelize.STRING},
        create_date:        {type: Sequelize.DATE},
        mod_date:           {type: Sequelize.DATE},
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: config.get('TBL_PREFIX') + 'foia'
    }
);

module.exports = {
    sequelize: sequelize,
    User: User,
    Fax: Fax,
    Target: Target,
    Outgoing: Outgoing,
    FOIA: FOIA
}