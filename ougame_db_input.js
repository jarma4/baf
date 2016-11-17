var fs = require('fs'),
   // csv = require('fast-csv'),
   mongoose = require('mongoose'),
   Ougame = require('./models/dbschema').Ougame;

mongoose.connect('mongodb://localhost/baf');

var teams = {
   Warriors: 'Golden State',
   Clippers: 'LA Clippers',
   Spurs: 'San Antonio',
   Thunder: 'Oklahoma City',
   Cavs: 'Cleveland',
   Rockets: 'Houston',
   Grizzlies: 'Memphis',
   Hawks: 'Atlanta',
   Bulls: 'Chicago',
   Pelicans: 'New Orleans',
   Heat: 'Miami',
   Wizards: 'Washington',
   Raptors: 'Toronto',
   Bucks: 'Milwaukee',
   Celtics: 'Boston',
   Jazz: 'Utah',
   Pacers: 'Indiana',
   Suns: 'Phoenix',
   Pistons: 'Detroit',
   Mavs: 'Dallas',
   Kings: 'Sacramento',
   Magic: 'Orlando',
   Hornets: 'Charlotte',
   Knicks: 'New York',
   Lakers: 'LA Lakers',
   Timberwolves: 'Minnesota',
   Nets: 'Brooklyn',
   Blazers: 'Portland',
   Nuggets: 'Denver',
   r76ers: 'Philadelphia'
};

fs.readdirSync(__dirname+'/ougame').forEach(function(filename){
   if (~filename.indexOf('.csv')) {
      fs.readFile(__dirname+'/ougame/'+filename, function(err, data) {
         if (err)
            console.log('error: '+err);
         else {
            var rows = data.toString().split('\r\n');
            console.log(rows);
            for (var i=1; i < rows.length; i++) {
               var obj = {};
               obj[filename.split('.')[0]] = rows[i].split(',')[1].slice(0,1).toUpperCase();
               console.log(obj);
               Ougame.update({team: teams[rows[i].split(',')[0]]}, obj, function(err) {
                  if (err)
                     console.log('database update: '+err);
               });
            }
            console.log(filename+' done');
         }
      });
   }
});


// Ougame.find({}, function(err, rec) {
//    console.log(rec);
// });
//how to remove juice
// var ml = [-500, 350];
// var implied_odds, total = 0, nojuice = [];
//net
// for (var i in ml) {
//    if (ml[i] < 0)
//       implied_odds = -1*ml[i] / (-1*ml[i] + 100);
//    else
//       implied_odds = 100 / (ml[i] + 100);
//    nojuice.push(implied_odds);
//    total += implied_odds;
//    console.log('implied_odds for '+i+' is '+ implied_odds);
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


      // var teams = ['Golden State','LA Clippers','San Antonio','Oklahoma City','Cleveland','Houston','Memphis','Atlanta','Chicago','New Orleans','Miami','Washington','Toronto','Milwaukee','Boston','Utah','Indiana','Phoenix','Detroit','Dallas','Sacramento','Orlando','Charlotte','New York','LA Lakers','Minnesota','Brooklyn','Portland','Denver','Philadelphia'];
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
