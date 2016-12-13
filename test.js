var request = require('request'),
// exec = require('child_process').exec,
   cheerio = require('cheerio');
var mongoose = require('mongoose'),
   // Players = require('./models/dbschema').Players,
   Bets = require('./models/dbschema').Bets,
   // Scores = require('./models/dbschema').Scores;
//    fs = require('fs'),
// Messages = require('./models/dbschema').Messages,
// Promise = require('promise'),
   fs = require('fs'),
   Ougame = require('./models/dbschema').Ougame;

mongoose.connect('mongodb://localhost/baf');

var debtList = {};
Bets.find({$and:[{paid:false},{$or:[{status:4},{status:5}]}]}, function(err, bets){
   bets.forEach(function(bet){
      // if (bet.user1 == 'jarma4' || bet.user2 == 'jarma4')
      //    console.log(bet.user1+' '+bet.user2);
      if (!debtList[bet.user1]){
         debtList[bet.user1] = {owe: {}, owed: {}};
      }
      if (!debtList[bet.user2]){
         debtList[bet.user2] = {owe: {}, owed: {}};
      }
      if (bet.status == 4) {
         if (!debtList[bet.user1].owed[bet.user2]) {
            debtList[bet.user1].owed[bet.user2] = 1;
         }
         if (!debtList[bet.user2].owe[bet.user1]) {
            debtList[bet.user2].owe[bet.user1] = 1;
         } else {
            debtList[bet.user1].owed[bet.user2] += 1;
            debtList[bet.user2].owe[bet.user1] += 1;
         }
      } else {
         if (!debtList[bet.user1].owe[bet.user2]){
            debtList[bet.user1].owe[bet.user2] = 1;
         }
         if (!debtList[bet.user2].owed[bet.user1]){
            debtList[bet.user2].owed[bet.user1] = 1;
         } else{
            debtList[bet.user1].owe[bet.user2] += 1;
            debtList[bet.user2].owed[bet.user1] += 1;
         }
      }
   });
   console.log(debtList);
   for (var user1 in debtList) {
      for (var user2 in debtList[user1].owe) {
         if (debtList[user2] && debtList[user2].owed[user1]) {
            console.log('=================');
            console.log(user1+' owes '+user2+' '+debtList[user1].owe[user2]);
            console.log(user2+' owes '+user1+' '+debtList[user2].owe[user1]);
         }
      }
   }
});

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

// Players.find({}, function(err, players) {
//    players.forEach(function(rec){
//       var score = rec.r_yards/10+rec.p_yards/10+rec.r_tds*6+rec.p_tds*6;
//       console.log(rec.player+' '+score);
//       Players.findByIdAndUpdate(rec._id, {points: score}, function(err, single){
//          if (err)
//             console.log('error');
//       });
//    });
// });
// var nflTeams = {'Atlanta': 'ATL', 'Arizona': 'ARZ', 'Carolina': 'CAR', 'Chicago': 'CHI', 'Dallas': 'DAL', 'Detroit': 'DET', 'Green Bay': 'GB', 'Minnesota': 'MIN', 'New Orleans': 'NO', 'NY Giants': 'NYG', 'Philadelphia': 'PHI', 'Seattle': 'SEA', 'San Francisco': 'SF', 'Los Angeles': 'LA', 'Tampa Bay': 'TB', 'Washington': 'WAS', 'Baltimore': 'BAL', 'Buffalo': 'BUF', 'Cincinnati': 'CIN', 'Cleveland': 'CLE', 'Denver': 'DEN', 'Houston': 'HOU', 'Kansas City': 'KC', 'Jacksonville': 'JAC', 'Indianapolis': 'IND', 'Miami': 'MIA', 'New England': 'NE', 'NY Jets': 'NYJ', 'Oakland': 'OAK', 'Pittsburgh': 'PIT', 'San Diego': 'SD', 'Tennessee': 'TEN'};
// var sports = ['nfl', 'nba'];
// for (var i=0; i < sports.length; i++) {
//    console.log(sports[i]);
// }


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
