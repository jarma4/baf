var request = require('request'),
fs = require('fs'),
exec = require('child_process').exec,
cheerio = require('cheerio'),
// Users = require('./models/dbschema').Users,
// Bets = require('./models/dbschema').Bets,
Scores = require('./models/dbschema').Scores,
mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/baf');

var dt = new Date(2016,0,1);
for(var i=1;i<2;i++){
   var url = 'http://www.oddsshark.com/nba/scores?date='+(dt.getMonth()+1)+'/'+dt.getDate()+'/2016';
   console.log(url);
   request(url, function (err, response, body) {
      if(!err && response.statusCode === 200) {
         var $ = cheerio.load(body);

         var keep, pingpong=0;
         $('.scores-data.last').each(function(){
            if (pingpong++ % 2) {
               matchup.team2 = $(this).prev().prev().prev().text();
               matchup.score2 = $(this).text();
               // matchup.week = wk;
               matchup.sport = 'nba';
               // matchup.year = 2015;
               console.log('2: '+matchup.team2+' '+matchup.score2);
               if (Number(matchup.score1) > Number(matchup.score2)) {
                  matchup.winner = 1;
               } else if (Number(matchup.score1)){
                  matchup.winner = 2;
               } else {
                  matchup.winner = 0;
               }
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
               console.log('1: '+matchup.team1+' '+matchup.score1);
               var tempdate = $(this).parent().prev().prev().children().first().html().split('<br>');
               var temptime = tempdate[1].split(':');
               console.log(tempdate[0].slice(1,4));
               matchup.date = new Date(tempdate[0]+((tempdate[0].slice(1,4)==='Dec')?' 2015 ':' 2016 ')+(Number(temptime[0])+Number((temptime[1].slice(-1) === 'p')?11:-1))+':'+temptime[1].slice(0,2));
               console.log(matchup.date);
            }
         });
      }
   });
   dt.setDate(dt.getDate()+3);
}
