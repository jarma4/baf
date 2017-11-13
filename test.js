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
   plivo = require('plivo'),
   Logs = require('./models/dbschema').Logs;
// mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf',{useMongoClient: true});

var dates = [],
   results = {},
   req= {
	body: {
		user: 'ALL',
		days: 0,
      sport: 'nfl',
      season: 2017
	}
};
// find start date for desired period
var startDate = new Date();
if (Number(req.body.days)) {  // if a number of days are given, go back from today that many
   startDate.setDate(startDate.getDate() - req.body.days);
} else { // else start at the begining of the season
      startDate = (req.body.sport == 'nfl')?1:Util.seasonStart.nba;
}
// find all valid bets during period, keep numBets and process
Bets.find({$and:[ (req.body.user == 'ALL')?{}:{$or:[{user1: req.body.user},
                                                   {user2: req.body.user}]},
                  {status:{$in: [4,5,6]}},
                  {sport: req.body.sport},
                  {season: req.body.season},
                  (req.body.days)?{date: {$gte: startDate}}:{}]}, function(err, bets){
   if (err) {
      console.log(err);
   } else {
      bets.forEach(function(bet, index){
      	if (!results[bet.user1]) {
            results[bet.user1]={total: 0, numBets: 0, data: []};
         }
      	if (!results[bet.user2]) {
            results[bet.user2]={total: 0, numBets: 0, data: []};
         }
         if (index === 0)
            startDate = bet.week;
         // check if stop date to store data
         if (bet.week > startDate) {
            // store date for xaxis labels
            dates.push(startDate);
            // on date, save win % per user
            for (var username in results) {
               results[username].data.push(results[username].total/results[username].numBets);
            }
            console.log(results);
            // advance next date to stop on
            startDate += 1;
         }
         if (bet.status == 4) {
            results[bet.user1].total++;
         } else if (bet.status == 5) {
            results[bet.user2].total++;
         } else {
            results[bet.user1].total+=0.5;
            results[bet.user2].total+=0.5;
         }
         results[bet.user1].numBets++;
         results[bet.user2].numBets++;
      });
      // push remaining info once done
      dates.push(startDate);
      for (var username in results) {
         results[username].data.push(results[username].total/results[username].numBets);
      }

   }
   console.log(results);
   // res.send({
   //   xaxis : dates,
   //   datasets: userData
   // });
}).sort({week: 1});

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
