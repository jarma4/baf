var request = require('request'),
fs = require('fs'),
exec = require('child_process').exec,
cheerio = require('cheerio'),
// Users = require('./models/dbschema').Users,
// Bets = require('./models/dbschema').Bets,
// Scores = require('./models/dbschema').Scores,
OUGame = require('./models/dbschema').OUGame,
mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/baf');


var url = 'http://www.oddsshark.com/nba/ats-standings';
request(url, function (err, response, body) {
   if(!err && response.statusCode === 200) {
      var $ = cheerio.load(body);

      var teams = ['Golden State','LA Clippers','San Antonio','Oklahoma City','Cleveland','Houston','Memphis','Atlanta','Chicago','New Orleans','Miami','Washington','Toronto','Milwaukee','Boston','Utah','Indiana','Phoenix','Detroit','Dallas','Sacramento','Orlando','Charlotte','New York','LA Lakers','Minnesota','Brooklyn','Portland','Denver','Philadelphia'];

      teams.forEach(function(name){
         var record = $('.base-table a:contains('+name+')').parent().next().text().split('-');
         var newproj = Number(record[0])/(Number(record[0])+Number(record[1]))*82;
         OUGame.findOne({team: name}, function(err, rec) {
            OUGame.update({team: name}, {win: record[0], loss: record[1], projection: newproj, status: (newproj > rec.line)?'Over':'Under'}, function(err, resp){
               if (err)
                  console.log('error');
               if (resp.n)
                  console.log('updated '+name+' record');
            });
         });
      });
   }
});
