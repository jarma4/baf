var request = require('request'),
// exec = require('child_process').exec,
   scraper = require('./models/scraper'),
   cheerio = require('cheerio'),
   bcrypt = require('bcrypt'),
   fs = require('fs'),
   Util = require('./models/util'),
   mongoose = require('mongoose'),
   Users = require('./models/dbschema').Users,
   Bets = require('./models/dbschema').Bets,
   Scores = require('./models/dbschema').Scores,
   Messages = require('./models/dbschema').Messages,
   Ougame = require('./models/dbschema').Ougame;

mongoose.connect('mongodb://localhost/baf', {user:'baf', pass: process.env.BAF_MONGO});

function getWeek(date, sport){
   var seasonStart = {
      nfl: new Date(2016,8,7),
      nba: new Date(2016,9,25)
   },
   dayTicks = 24 * 60 * 60 * 1000;
   return Math.ceil((date - ((sport=='nba')?seasonStart.nba:seasonStart.nfl)) / dayTicks / 7);
}

console.log(getWeek(new Date(2016,9,29),'nba'));
// console.log(getWeek(now));
function getWeekOld(date){
   var wk = 1,
      dstFlag=0,
      seasonStart = new Date(2016,8,7),
      nflWeeks = [];
   for (var i=0; i<23; i++){
      if (i > 7)
         dstFlag = 3600000;
      nflWeeks.push(new Date(seasonStart.valueOf()+i*7*86400000+dstFlag));
   }
   if (date > nflWeeks[0]) {
      for (i=0; i<23; i++){
         if (date > nflWeeks[i] && date < nflWeeks[i+1]) {
            wk = i+1;
            break;
         }
      }
   }
   return wk;
}
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
