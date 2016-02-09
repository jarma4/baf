var request = require('request'),
fs = require('fs'),
exec = require('child_process').exec,
cheerio = require('cheerio'),
// Users = require('./models/dbschema').Users,
Bets = require('./models/dbschema').Bets,
Scores = require('./models/dbschema').Scores,
mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/baf');

Bets.find({$and:[{status:2}, {sport:'nba'}, {gametime:{$lt: new Date()}}]}, function(err, acceptedBets){  //find accepted bets
   acceptedBets.forEach(function(singleBet){				//go through each bet
      Scores.find({$and:[{sport: singleBet.sport}, //look for game bet is for
                        {winner:{$ne: 0}},
                        {$or:[{$and:[{team1: singleBet.team1.replace('@','')},
                                    {team2: singleBet.team2.replace('@','')}]},
                              {$and:[{team1: singleBet.team2.replace('@','')},
                                    {team2: singleBet.team1.replace('@','')}]}]},
                        {date:{$gt: singleBet.gametime.setHours(0,0)}},
                        {date:{$lt: singleBet.gametime.setHours(23,59)}}]}, function(err, matches){
         matches.forEach(function(game) {  //go through each game match
            if(err)
               console.log(err);
            else {
               if (game.team1 === singleBet.team1.replace('@','')) {		//did user1 have first team in game
                  if (game.score1+singleBet.odds > game.score2) {
                     console.log(singleBet.user1+' won '+singleBet.user2+' lost');
                     // updateBet(single,{status:4});
                     // updateWinnerLoser(single.user1,single.user2,0);
                  } else if (game.score1+singleBet.odds < game.score2) {
                     console.log(singleBet.user1+' lost'+singleBet.user2+' won');
                     // updateBet(single.id,{status:5});
                     // updateWinnerLoser(single.user2,single.user1,0);
                  } else {
                     console.log(singleBet.user1+' push*');
                     // updateBet(single.id,{status:6});
                     // updateWinnerLoser(single.user1,single.user2,1);
                  }
               } else {			//user1 must have had second team in game
                  if (game.score2+singleBet.odds > game.score1) {
                     console.log(singleBet.user1+' won '+singleBet.user2+' lost');
                     // updateBet(single.id,{status:4});
                     // updateWinnerLoser(single.user1,single.user2);
                  } else if (game.score2+singleBet.odds < game.score1) {
                     console.log(singleBet.user1+' lost '+singleBet.user2+' won');
                     // updateBet(single.id,{status:5});
                     // updateWinnerLoser(single.user2,single.user1);
                  } else {
                     console.log(singleBet.user1+' push**');
                     // updateBet(single.id,{status:6});
                     // updateWinnerLoser(single.user1,single.user2,1);
                  }
               }
            }
         });
      });
   });
});
