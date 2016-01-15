var request = require('request'),
fs = require('fs'),
exec = require('child_process').exec,
cheerio = require('cheerio'),
// Users = require('./models/dbschema').Users,
// Bets = require('./models/dbschema').Bets,
Scores = require('./models/dbschema').Scores,
mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/baf');

var url = 'http://www.oddsshark.com/stats/scoreboardbyweek/football/nfl/d/2016';
request(url, function (err, response, body) {
   if(!err && response.statusCode === 200) {
      var $ = cheerio.load(body);

      var keep, pingpong=0;
      $('.scores-data.last').each(function(){
         if (pingpong++ % 2) {
            matchup.team2 = $(this).prev().prev().prev().text();
            matchup.score2 = $(this).text();
            matchup.week = 18;
            matchup.year = 2016;
            matchup.sport = 'nfl';
            if (Number(matchup.score1) > Number(matchup.score2)) {
               matchup.winner = 1;
            } else {
               matchup.winner = 2;
            }
            console.log(matchup);
            matchup.save(function(err) {
               if(err) {
                  console.log('Trouble');
               } else {
                  console.log('Added game score');
               }
            });
         } else {
            matchup = new Scores();
            matchup.team1 = $(this).prev().prev().prev().prev().text();
            matchup.score1 = $(this).text();
         }
      });
   }
});
