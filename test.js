var request = require('request'),
// exec = require('child_process').exec,
   scraper = require('./models/scraper'),
   cheerio = require('cheerio'),
   fs = require('fs'),
   logger = require('pino')({}, fs.createWriteStream('./my-log', {'flags': 'a'})),
   Util = require('./models/util'),
   mongoose = require('mongoose'),
   OUgame = require('./models/dbschema').OUgame,
   OUuser = require('./models/dbschema').OUuser,
   Users = require('./models/dbschema').Users,
   Bets = require('./models/dbschema').Bets,
   Scores = require('./models/dbschema').Scores,
   Messages = require('./models/dbschema').Messages,
   Logs = require('./models/dbschema').Logs;

mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf',{useMongoClient: true});
var names = {sergio:'Serg', tony:'jarma4', john:'Jmcgeady', aaron:'aaron', eric:'KRELL', russell: 'russell'};
// OUgame.find({season:2016}, function(err, teams){
OUgame.find({season:2016}, function(err, teams){
   teams.forEach(function(record, i){
      var temp = {};
      temp[i] = record.russell;
      OUuser.update({season:2016, sport:'nba', user:'russell'},temp, function(err){
         if(err)
            console.log('error: '+err);
         console.log('updated');
      });
   });
}).sort({index:1});
// });

// OUuser.find({}, function(err, teams) {
//    var temp = {0:'',1:'',2:'',3:'',4:'',5:'',6:'',7:'',8:'',9:'',10:'',11:'',12:'',13:'',14:'',15:'',16:'',17:'',18:'',19:'',20:'',21:'',22:'',23:'',24:'',25:'',26:'',27:'',28:'',29:'',30:'',31:''};
//    teams.forEach(function(team, inc){
//       OUuser.update({_id: team._id}, {$set: temp}, {multi:1}, function(err){
//          if(err)
//             console.log('problem adding');
//          else {
//             console.log('added');
//          }
//       });
//    });
// }).sort({team:1});

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
