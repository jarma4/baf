var cat = require('request'),
// exec = require('child_process').exec,
   scraper = require('./models/scraper'),
   cheerio = require('cheerio'),
   fs = require('fs'),
   // logger = require('pino')({}, fs.createWriteStream('./my-log', {'flags': 'a'})),
   Util = require('./models/util'),
   jsonfile = require('jsonfile'),
   mongoose = require('mongoose'),
   OUgame = require('./models/dbschema').OUgame,
   OUuser = require('./models/dbschema').OUuser,
   Users = require('./models/dbschema').Users,
   Bets = require('./models/dbschema').Bets,
   Scores = require('./models/dbschema').Scores,
   Props = require('./models/dbschema').Props,
   Messages = require('./models/dbschema').Messages,
   Nexmo = require('nexmo'),
   Logs = require('./models/dbschema').Logs;
// mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf',{useMongoClient: true});

// scraper.addNbaGames(new Date(), new Date(2018,3,11));

// var sms = plivo.RestAPI({
//   authId: 'MANJRMMDLJYME1MMYYOG',
//   authToken: 'ZjcyZmI5MGVhMGFlMWIzNWEyYzg0ZDFiOWJmMmUw'
// });
//
// sms.send_message({
//    src: '+16622193664',
//    dst: '+15122937112',
//    text: 'test from Plivosudo npm'
// }, function (status, response) {
//    console.log(status);
//    console.log('API Response:\n', response);
// });

//how to remove juice
// var ml = [-500, 350];
// var implied_odds, total = 0, nojuice = [];
//
// for (var i in ml) {
//    if (ml[i] < 0)
//       implied_odds = -1*ml[i] / (-1*ml[i] + 100);
//    else
//       implied_odds = 100 / (ml[i] + 100);
//    nojuice.push(implied_odds);
//    total += implied_odds;
//    console.log('implied_odds for '+ml[i]+' is '+ implied_odds);
// }
// console.log('nojuice is '+nojuice[0]/total*100+'% and '+nojuice[1]/total*100+'%');
