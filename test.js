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

mongoose.connect('mongodb://localhost/baf', {user:'baf', pass: process.env.BAF_MONGO});
nbaTeams2 = {'Hawks': 'ATL', 'Bulls': 'CHI', 'Mavericks': 'DAL', 'Pistons': 'DET', 'Timberwolves': 'MIN', 'Pelicans': 'NOH', 'Knicks': 'NY', 'Nets': 'BKN', '76ers': 'PHI', 'Thunder': 'OKC', 'Clippers': 'LAC','Lakers': 'LAL', 'Wizards': 'WAS', 'Cavaliers': 'CLE', 'Nuggets': 'DEN', 'Rockets': 'HOU', 'Pacers': 'IND', 'Heat': 'MIA', 'Celtics': 'BOS', 'Warriors': 'GS', 'Golden State': 'GS', 'Spurs': 'SAN', 'Kings': 'SAC', 'Trail Blazers': 'POR', 'Magic': 'ORL', 'Hornets': 'CHR', 'Suns': 'PHO', 'Raptors': 'TOR', 'Bucks': 'MIL', 'Jazz': 'UTA', 'Grizzlies': 'MEM'};

var url = 'http://www.si.com/nba/scoreboard?date=2017-01-08';

request(url, function (err, response, body) {
   if(!err && response.statusCode === 200) {
      var $ = cheerio.load(body);
      // console.log(body);
      $('.final').each(function(){
      // $('.game-status.postgame.team').each(function(){
         console.log($(this).find('.team-name').first().text()+' '+$(this).find('.team-score').first().text().replace(/\s/g,''));
         console.log($(this).find('.team-name').last().text()+' '+$(this).find('.team-score').last().text().replace(/\s/g,''));
      });
   }
});
// var debtList = {};
// Bets.find({$and:[{paid:false},{$or:[{status:4},{status:5}]}]}, function(err, bets){
//    bets.forEach(function(bet){
//       // if (bet.user1 == 'jarma4' || bet.user2 == 'jarma4')
//       //    console.log(bet.user1+' '+bet.user2);
//       if (!debtList[bet.user1]){
//          debtList[bet.user1] = {debt: {}, credit: {}};
//       }
//       if (!debtList[bet.user2]){
//          debtList[bet.user2] = {debt: {}, credit: {}};
//       }
//       if (bet.status == 4) {
//          if (!debtList[bet.user1].credit[bet.user2]) {
//             debtList[bet.user1].credit[bet.user2] = 1;
//          }
//          if (!debtList[bet.user2].debt[bet.user1]) {
//             debtList[bet.user2].debt[bet.user1] = 1;
//          } else {
//             debtList[bet.user1].credit[bet.user2] += 1;
//             debtList[bet.user2].debt[bet.user1] += 1;
//          }
//       } else {
//          if (!debtList[bet.user1].debt[bet.user2]){
//             debtList[bet.user1].debt[bet.user2] = 1;
//          }
//          if (!debtList[bet.user2].credit[bet.user1]){
//             debtList[bet.user2].credit[bet.user1] = 1;
//          } else{
//             debtList[bet.user1].debt[bet.user2] += 1;
//             debtList[bet.user2].credit[bet.user1] += 1;
//          }
//       }
//    });
//    console.log(debtList);
//    for (var user1 in debtList) {
//       for (var user2 in debtList[user1].debt) {
//          if (debtList[user2] && debtList[user2].credit[user1]) {
//             console.log('======='+user1+' '+user2+'==========');
//             // console.log(user1+' debts '+user2+' '+debtList[user1].debt[user2]);
//             // console.log(user2+' debts '+user1+' '+debtList[user2].debt[user1]);
//             if (debtList[user1].debt[user2] >= debtList[user2].credit[user1])
//                console.log(user2+'s '+debtList[user2].debt[user1]+' debts to '+user1+' can be erased');
//          }
//       }
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
