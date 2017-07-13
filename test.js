var request = require('request'),
// exec = require('child_process').exec,
   scraper = require('./models/scraper'),
   cheerio = require('cheerio'),
   fs = require('fs'),
   logger = require('pino')({}, fs.createWriteStream('./my-log', {'flags': 'a'})),
   Util = require('./models/util'),
   mongoose = require('mongoose'),
   Users = require('./models/dbschema').Users,
   Bets = require('./models/dbschema').Bets,
   Scores = require('./models/dbschema').Scores,
   Messages = require('./models/dbschema').Messages,
   Logs = require('./models/dbschema').Logs;

//mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf',{useMongoClient: true});

logger.info('info test3');
// }

// Users.findOneAndUpdate({_id:'jarma44', bets:0}, {}, function(err, record) {
//    if(record)
//       console.log(record);
//    else {
//       console.log('nothing');
//    }
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
