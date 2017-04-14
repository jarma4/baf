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

function getOdds(sport) {
   var url = 'http://www.oddsshark.com/'+sport+'/odds';
   console.log('refeshing '+sport+' odds - '+url);
   request(url, function (err, response, body) {
      if(!err && response.statusCode == 200) {
         var $ = cheerio.load(body);

         // get matchup w/ team names & date
         var pingpong = 0,
         games = [],
         matchup = new Object({});
         $('.op-matchup-team','#op-content-wrapper').each(function(){
               if (pingpong++ % 2){
                  matchup.team2 = '@'+JSON.parse($(this).attr('data-op-name')).short_name;
                  games.push(matchup);
                  matchup = {};
               }
               else {
                  var tempdate = JSON.parse($(this).parent().parent().prevAll('.no-group-name').attr('data-op-date')).short_date;
                  var temptime = $(this).parent().prev().text().split(':');
                  matchup.date = new Date(tempdate+' '+'2017'+' '+(Number(temptime[0])+Number((temptime[1].slice(-1) == 'p')?11:-1))+':'+temptime[1].slice(0,2));
                  matchup.team1 = JSON.parse($(this).attr('data-op-name')).short_name;
               }
            });

         // get odds for matchups
         var gameIndex = 0;
         $('.op-item-row-wrapper','#op-results').each(function(){
            var tmp = $('.op-westgate',$(this).find($('.op-item-wrapper')));
            if (JSON.parse($(tmp).attr('data-op-info')).fullgame != 'Ev') {
               games[gameIndex].spread = Number(JSON.parse($(tmp).attr('data-op-info')).fullgame);
            }
            else {
               games[gameIndex].spread = 0;
            }
            games[gameIndex].over = Number(JSON.parse($(tmp).attr('data-op-total')).fullgame);
            games[gameIndex].moneyline1 = Number(JSON.parse($(tmp).attr('data-op-moneyline')).fullgame);
            games[gameIndex++].moneyline2 = Number(JSON.parse($(tmp).next().next().attr('data-op-moneyline')).fullgame);
         });
console.log(games);
         var now = new Date();
         var sendData = {
            'time': now.getMonth()+1+'/'+now.getDate()+' '+now.getHours()+':'+('0'+now.getMinutes()).slice(-2),
            'week':  Util.getWeek(now, sport),
            'games': games};
         if (games.length) { // only write if something was found
            //console.log(games);
            var success = fs.writeFileSync('json/'+sport+'_odds.json',JSON.stringify(sendData));
         }
      }
   });
}

module.exports = {getOdds};
// getOdds('ncaab');

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
