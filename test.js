var request = require('request'),
// exec = require('child_process').exec,
   cheerio = require('cheerio');
var mongoose = require('mongoose'),
   // Players = require('./models/dbschema').Players,
   // Bets = require('./models/dbschema').Bets,
   Scores = require('./models/dbschema').Scores;
//    fs = require('fs'),
// Messages = require('./models/dbschema').Messages,
// Promise = require('promise'),
// OUGame = require('./models/dbschema').OUGame,
mongoose.connect('mongodb://localhost/baf');

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
var nflTeams = {'Atlanta': 'ATL', 'Arizona': 'ARZ', 'Carolina': 'CAR', 'Chicago': 'CHI', 'Dallas': 'DAL', 'Detroit': 'DET', 'Green Bay': 'GB', 'Minnesota': 'MIN', 'New Orleans': 'NO', 'NY Giants': 'NYG', 'Philadelphia': 'PHI', 'Seattle': 'SEA', 'San Francisco': 'SF', 'Los Angeles': 'LA', 'Tampa Bay': 'TB', 'Washington': 'WAS', 'Baltimore': 'BAL', 'Buffalo': 'BUF', 'Cincinnati': 'CIN', 'Cleveland': 'CLE', 'Denver': 'DEN', 'Houston': 'HOU', 'Kansas City': 'KC', 'Jacksonville': 'JAC', 'Indianapolis': 'IND', 'Miami': 'MIA', 'New England': 'NE', 'NY Jets': 'NYJ', 'Oakland': 'OAK', 'Pittsburgh': 'PIT', 'San Diego': 'SD', 'Tennessee': 'TEN'};
var sports = ['nfl', 'nba'];
for (var i=0; i < sports.length; i++) {
   console.log(sports[i]);
}
// for (var i = 2; i < 18; i++) {
//    addGame(i, 2016, 'nfl');
// }

function addGame (wk, yr, sprt) {
   var url = 'http://sports.yahoo.com/nfl/scoreboard/?week='+wk+'&phase=2&season=2016';
   request(url, function (err, response, body) {
      if(!err && response.statusCode === 200) {
         var $ = cheerio.load(body);
         $('.game').each(function(){
            var tmp = new Scores({
               score1: 0,
               score2: 0,
               winner: 0,
               sport: sprt,
               year: yr,
               week: wk,
               team1: nflTeams[$(this).children().next().children().children().first().text()],
               team2:nflTeams[ $(this).children().next().next().next().children().children().next().first().text()]
            }).save(function(err){
               if(err) {
                  console.log('Trouble adding game');
               } else {
                  console.log('Week '+wk+' game added');
               }
            });
         });
      }
   });
}
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
