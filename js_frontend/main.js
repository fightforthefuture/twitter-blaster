var $c = document.createElement.bind(document);
var IMG_HEIGHT = 80;
var scroll_listeners = {};
var DEFAULT_TWEET = 'It\'s baffling how poorly Congress seems to understand technology. #FaxBigBrother #StopCISA pic.twitter.com/7SdsKf4C3p ';
var FAXED_TWEET = 'Congress doesn\'t understand modern technology, so I FAXED them to #StopCISA (yet another spying bill). Check it out: ';
var EMERGENCY_TWEET = 'please vote NO on #CISA! If you vote yes, I pledge to vote against your re-election. https://www.faxbigbrother.com';
var FACEBOOK_SHARE_URL = 'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.faxbigbrother.com%2F';
var TAG = 'faxbigbrother';
var CALL_CAMPAIGN = 'cisa-cloture-fax';
var EMAIL_SUBJECT = 'Please stop CISA';
var FAX_TAG = 'companies';

// JL HACK ~ Fix referrer for reddit -------------------------------------------
if (document.referrer.indexOf('reddit') != -1) {
    document.getElementById('default_action').style.display = 'none';
    document.getElementById('reddit_alt').style.display = 'block';
}
// -----------------------------------------------------------------------------

var fb = document.querySelectorAll('a.facebook');
for (var i = 0; i < fb.length; i++) {
    fb[i].addEventListener('click', function(e) {
        e.preventDefault();
        util.share();
    }, false);
}

var tw = document.querySelectorAll('a.twitter');
for (var i = 0; i < tw.length; i++) {
    tw[i].addEventListener('click', function(e) {
        e.preventDefault();
        util.tweet();
    }, false);
}

var org             = util.getParameterByName('org');

var orgController   = new OrgReferralController({el: '#disclosures'});
var user            = new UserModel();
var faxForm         = new FaxComposerFormController({ faxTag: FAX_TAG });

/*
var targets = [
    {
        first_name: 'Michael',
        last_name: 'Bennet',
        twitter: 'senbennetco',
        phone: '202-224-5852',
        image: 'cobennetmichaelf.jpg',
        state: 'Colorado'
    },
    {
        first_name: 'Cory',
        last_name: 'Booker',
        twitter: 'corybooker',
        phone: '202-224-3224',
        image: 'njbookercory.jpg',
        state: 'New Jersey'
    },
    {
        first_name: 'Barbara',
        last_name: 'Boxer',
        twitter: 'SenatorBoxer',
        phone: '202-224-3553',
        image: 'caboxerbarbara.jpg',
        state: 'California'
    },
    {
        first_name: 'Sherrod',
        last_name: 'Brown',
        twitter: 'SenSherrodBrown',
        phone: '202-224-2315',
        image: 'ohbrownsherrod.jpg',
        state: 'Ohio'
    },
    {
        first_name: 'Maria',
        last_name: 'Cantwell',
        twitter: 'SenatorCantwell',
        phone: '202-224-3441',
        image: 'wacantwellmaria.jpg',
        state: 'Washington'
    },
    {
        first_name: 'Ben',
        last_name: 'Cardin',
        twitter: 'senatorcardin',
        phone: '202-224-4524',
        image: 'mdcardinbenjaminl.jpg',
        state: 'Maryland'
    },
    {
        first_name: 'Tom',
        last_name: 'Carper',
        twitter: 'senatorcarper',
        phone: '202-224-2441',
        image: 'decarperthomasr.jpg',
        state: 'Delaware'
    },
    {
        first_name: 'Bob',
        last_name: 'Casey',
        twitter: 'senbobcasey',
        phone: '202-224-6324',
        image: 'pacaseybobjr.jpg',
        state: 'Pennsylvania'
    },
    {
        first_name: 'Heidi',
        last_name: 'Heitkamp',
        twitter: 'senatorheitkamp',
        phone: '202-224-2043',
        image: 'ndheitkampheidi.jpg',
        state: 'North Dakota'
    },
    {
        first_name: 'Tim',
        last_name: 'Kaine',
        twitter: 'timkaine',
        phone: '202-224-4024',
        image: 'vakainetimothym.jpg',
        state: 'Virginia'
    },
    {
        first_name: 'Amy',
        last_name: 'Klobuchar',
        twitter: 'amyklobuchar',
        phone: '202-224-3244',
        image: 'mnklobucharamy.jpg',
        state: 'Minnesota'
    },
    {
        first_name: 'Joe',
        last_name: 'Manchin',
        twitter: 'sen_joemanchin',
        phone: '202-224-3954',
        image: 'wvmanchinjoeiii.jpg',
        state: 'West Virginia'
    },
    {
        first_name: 'Bob',
        last_name: 'Menendez',
        twitter: 'senatormenendez',
        phone: '202-224-4744',
        image: 'njmenendezrobert.jpg',
        state: 'New Jersey'
    },
    {
        first_name: 'Barb',
        last_name: 'Mikulski',
        twitter: 'senatorbarb',
        phone: '202-224-4654',
        image: 'mdmikulskibarbaraa.jpg',
        state: 'Maryland'
    },
    {
        first_name: 'Chris',
        last_name: 'Murphy',
        twitter: 'chrismurphyct',
        phone: '202-224-4041',
        image: 'ctmurphychristopher.jpg',
        state: 'Connecticut'
    },
    {
        first_name: 'Jack',
        last_name: 'Reed',
        twitter: 'senjackreed',
        phone: '202-224-4642',
        image: 'rireedjack.jpg',
        state: 'Rhode Island'
    },
    {
        first_name: 'Harry',
        last_name: 'Reid',
        twitter: 'senatorreid',
        phone: '202-224-3542',
        image: 'nvreidharry.jpg',
        state: 'Nevada'
    },
    {
        first_name: 'Chuck',
        last_name: 'Schumer',
        twitter: 'senschumer',
        phone: '202-224-6542',
        image: 'nyschumercharlese.jpg',
        state: 'New York'
    },
    {
        first_name: 'Debbie',
        last_name: 'Stabenow',
        twitter: 'stabenow',
        phone: '202-224-4822',
        image: 'mistabenowdebbie.jpg',
        state: 'Michigan'
    },
    {
        first_name: 'Elizabeth',
        last_name: 'Warren',
        twitter: 'senwarren',
        phone: '202-224-4543',
        image: 'mawarrenelizabetha.jpg',
        state: 'Massachusetts'
    },
    {
        first_name: 'Sheldon',
        last_name: 'Whitehouse',
        twitter: 'senwhitehouse',
        phone: '202-224-2921',
        image: 'riwhitehousesheldon.jpg',
        state: 'Rhode Island'
    },
];

new SenatorListController({
    collection: new Composer.Collection(targets)
});

// new CallModalController({});

var senate_petition_controller = new EmailPetitionController({
    el: document.querySelector('#last_ditch_petition')
});
*/

if (util.getParameterByName('call'))
    new CallModalController();