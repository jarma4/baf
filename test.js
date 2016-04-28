// var request = require('request'),
// exec = require('child_process').exec,
// cheerio = require('cheerio'),
var Users = require('./models/dbschema').Users,
   Bets = require('./models/dbschema').Bets,
   fs = require('fs'),
// Messages = require('./models/dbschema').Messages,
// Promise = require('promise'),
// OUGame = require('./models/dbschema').OUGame,
// // Scores = require('./models/dbschema').Scores,
mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/baf');

// var startDate = new Date("Dec 25 2015"),
//    username = 'KRELL',
//    weeks = [],
//    xaxis = [],
//    yaxis = [],
//    totals = 0,
//    results = {};
//
// for(var i = 0; i < 15; i++) {
//    // console.log(weeks);
//    weeks.push(new Date(startDate.setDate(startDate.getDate() + 7)));
// }
// console.log(weeks);
var userList = [],
   totals = {},         // rolling storage for win amount per user
   counters = {},       // rolling storage for number of bets per user
   currentDate = new Date('Jan 28 2016'), // first date to store data per user
   dates = [],          // xaxis data to be sent
   userData = [];       // datasets for each user

// find users to get bet data for and intialize storage variables
Users.find({_id: {$ne: 'testuser'}}, {_id: 1}, function(err,users){
   users.forEach(function(user){
      userList.push(user._id);
      userData.push({
         name: user._id,
         data: []
      });
      totals[user._id] = 0;
      counters[user._id] = 0;
   });
   // console.log(counters);
}).sort({_id:1});

Bets.find({$and:[ {status:{$in: [4,5,6]}},
                  {sport: 'nba'}]}, function(err,bets){
   if (err) {
      console.log(err);
   } else {
      bets.forEach(function(bet, index){
         if (bet.status == 4) {
            totals[bet.user1]++;
            counters[bet.user1]++;
            counters[bet.user2]++;
         } else if (bet.status == 5) {
            totals[bet.user2]++;
            counters[bet.user1]++;
            counters[bet.user2]++;
         } else if (bet.status == 6) {
            totals[bet.user1] +=0.5;
            counters[bet.user1]++;
            totals[bet.user2] +=0.5;
            counters[bet.user2]++;
         }

         // check if stop date to store data
         if (bet.gametime > currentDate) {
            // store date for xaxis labels
            dates.push(currentDate.getMonth()+1+'/'+currentDate.getDate());

            // on date, save win % per user
            userList.forEach(function(username, index){
               userData[index].data.push(totals[username]/counters[username]);
            });

            // advance next date to stop on
            currentDate.setDate(currentDate.getDate()+5);
         }
      });
   }
   var sendData = {
      xaxis : dates,
      datasets: userData
   };
   var success = fs.writeFileSync('sample.json',JSON.stringify(sendData,0,3));
});

//    var today = new Date();
//    Messages.findOne({date: {$gte: today.setDate(today.getDate()-3)}}, function(err, messages) {
//       if (messages){
//          answer.type = 'message';
//          answer.msgboard = true;
//       }
//       res.send(answer);
//    });
// });

// var url = 'http://www.oddsshark.com/nba/ats-standings';
// request(url, function (err, response, body) {
//    if(!err && response.statusCode === 200) {
//       var $ = cheerio.load(body);
//
//       var teams = ['Golden State','LA Clippers','San Antonio','Oklahoma City','Cleveland','Houston','Memphis','Atlanta','Chicago','New Orleans','Miami','Washington','Toronto','Milwaukee','Boston','Utah','Indiana','Phoenix','Detroit','Dallas','Sacramento','Orlando','Charlotte','New York','LA Lakers','Minnesota','Brooklyn','Portland','Denver','Philadelphia'];
//
//       teams.forEach(function(name){
//          var record = $('.base-table a:contains('+name+')').parent().next().text().split('-');
//          var newproj = Number(record[0])/(Number(record[0])+Number(record[1]))*82;
//          OUGame.findOne({team: name}, function(err, rec) {
//             OUGame.update({team: name}, {win: record[0], loss: record[1], projection: newproj, status: (newproj > rec.line)?'Over':'Under'}, function(err, resp){
//                if (err)
//                   console.log('error');
//                if (resp.n)
//                   console.log('updated '+name+' record');
//             });
//          });
//       });
//    }
// });
