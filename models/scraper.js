var request = require('request'),
fs = require('fs'),
cheerio = require('cheerio'),
Users = require('./dbschema').Users,
Bets = require('./dbschema').Bets,
Scores = require('./dbschema').Scores,
mongoose = require('mongoose');

var seasonStart = new Date(2015,8,8),
   nflWeeks = [],
   numWeeks = 22,
   daylight_savings_offset = 0;
for (var i=0;i<numWeeks;i++){
   if (i > 7)
      daylight_savings_offset = 3600000;
   nflWeeks.push(new Date(seasonStart.valueOf()+i*7*86400000+daylight_savings_offset));
}

function getOdds(sport) {
   var url = 'http://www.oddsshark.com/'+sport+'/odds';
   // console.log('refeshing '+sport+' odds - '+new Date());
   request(url, function (err, response, body) {
      if(!err && response.statusCode === 200) {
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
                  matchup.date = new Date(tempdate+' 2016 '+(Number(temptime[0])+Number((temptime[1].slice(-1) === 'p')?11:-1))+':'+temptime[1].slice(0,2));
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
         var now = new Date();
         var sendData = {'time': now.getMonth()+1+'/'+now.getDate()+' '+now.getHours()+':'+('0'+now.getMinutes()).slice(-2),
            'week':  module.exports.getWeek(now),
            'games': games};
         var success = fs.writeFileSync(sport+'_info.json',JSON.stringify(sendData,0,3));
      }
   });
}

function updateBet(id,object){
	Bets.update({_id:id},{$set:object},function(err){
		if (err)
			console.log(id+' had trouble updating - ');
		else
			console.log(id+' bet updated - '+new Date());
	});
}

function updateWinnerLoser(winner,loser,push){
	Users.update({_id:winner},(push)?{$inc:{push_nfl:1}}:{$inc:{win_nfl:1}},function(err){
		if (err)
			console.log(_id+' had trouble updating - '+new Date());
		else
			console.log(winner+' is winner - '+new Date());
	});
   Users.update({_id:loser},(push)?{$inc:{push_nfl:1}}:{$inc:{loss_nfl:1}},function(err){
		if (err)
			console.log(_id+' had trouble updating  - '+new Date());
		else
			console.log(loser+' is loser - '+new Date());
	});
}

module.exports = {
   getWeek: function(date){
      var wk=0;
      for (i=0;i<numWeeks;i++){
         if (date > nflWeeks[i] && date < nflWeeks[i+1]) {
            wk = i+1;
            break;
         }
      }
      return wk;
   },
   refreshOddsInfo: function() {
      getOdds('nfl');
      getOdds('nba');
   },

   checkScores: function(sport) {
      var url;
      if (sport==='nfl') {
         wk = module.exports.getWeek(new Date());
         url = 'http://www.oddsshark.com/stats/scoreboardbyweek/football/nfl/'+((wk>17)?((wk>18)?((wk>19)?'c':'d'):'w'):wk)+'/2015';
      } else {
         var today = new Date();
         url = 'http://www.oddsshark.com/nba/scores?date='+(today.getMonth()+1)+'/'+today.getDate()+'/'+today.getFullYear();
      }
      request(url, function (err, response, body) {
      	if(!err && response.statusCode === 200) {
      		var $ = cheerio.load(body);

      		var keep, pingpong=0;
      		$('.date.last').each(function(){
      			if ($(this).text().indexOf('Final') >= 0) {
      				tm1 = $(this).parent().next().next().children().first().text();
      				sc1 = $(this).parent().next().next().children('.scores-data.last').text();
      				tm2 = $(this).parent().next().next().next().children().first().text();
      				sc2 = $(this).parent().next().next().next().children('.scores-data.last').text();
                  if (Number(sc1) > Number(sc2))
                     wnr = 1;
                  else
                     wnr = 2;
                  // var period = ((sport==='nfl')?{week:wk}:{$and:[{date:{$gt:new Date().setHours(0,0)}}, {date:{$lt:new Date().setHours(23,59)}}]});
      				Scores.update({$and:[{sport:sport},
                                       {team1:tm1},
                                       {team2:tm2},
                                       {winner:0},
                                       ((sport==='nfl')?{week:wk}:{$and:[{date:{$gt:new Date().setHours(0,0)}}, {date:{$lt:new Date().setHours(23,59)}}]})]}, {score1: sc1, score2:sc2, winner:wnr},function(err, resp) {
      					if (err)
      						console.log('error');
      					if (resp.n)
      						console.log('final score for '+tm1+'/'+tm2+' changed '+new Date());
      				});
      			}
      		});
         }
      });
   },

   clearUnactedBets: function(){
      // below search for unacted bets and marks refused after game starts
      Bets.find({status:0}, function(err, bets){
      	bets.forEach(function(single){
            if (single.gametime < new Date()) {
               Bets.update({_id:single._id},{status:3}, function(err){
         			if(err)
         				console.log(err);
         			else
                     console.log(single.team1+'/'+single.team2+' game started - unacted changed to refused - '+new Date()+' gametime='+single.gametime);
   		      });
               Users.update({_id:single.user2},{$inc: {messages: -1}}, function(err){
                  if(err)
                     console.log(err);
               });
             }
      	});
      });
   },

   clearRefusedBets: function(){
      // below search for unacted bets and marks refused after game starts
      Bets.remove({status:3}, function(err){
			if(err)
				console.log(err);
			else
            console.log('Refused bets cleared - '+new Date());
      });
   },

   tallyBets: function(){
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
      							updateBet(singleBet.id,{status:4});
      							updateWinnerLoser(singleBet.user1,single.user2,0);
      						} else if (game.score1+singleBet.odds < game.score2) {
      							updateBet(singleBet.id,{status:5});
                           updateWinnerLoser(singleBet.user2,singleBet.user1,0);
      						} else {
      							updateBet(singleBet.id,{status:6});
                           updateWinnerLoser(singleBet.user1,singleBet.user2,1);
      						}
      					} else {			//user1 must have had second team in game
      						if (game.score2+singleBet.odds > game.score1) {
      							updateBet(singleBet.id,{status:4});
                           updateWinnerLoser(singleBet.user1,single.user2);
      						} else if (game.score2+singleBet.odds < game.score1) {
      							updateBet(singleBet.id,{status:5});
                           updateWinnerLoser(singleBet.user2,singleBet.user1);
      						} else {
      							updateBet(singleBet.id,{status:6});
                           updateWinnerLoser(singleBet.user1,singleBet.user2,1);
      						}
      					}
      				}
      			});
      		});
      	});
      });
   },

   getScores: function(wk) {
      var url = 'http://www.oddsshark.com/stats/scoreboardbyweek/football/nfl/'+wk+'/2015';
      request(url, function (err, response, body) {
       	if(!err && response.statusCode === 200) {
      		var $ = cheerio.load(body);

            Scores.remove({week:wk}, function(err, cnt){
               if(err)
                  console.log(err);
               else
                  console.log(cnt+' docs removed');
            });

            var keep, pingpong=0;
      		$('.scores-data.last').each(function(){
               if (pingpong++ % 2) {
                  matchup.team2 = $(this).prev().prev().prev().text();
                  matchup.score2 = $(this).text();
                  matchup.week = wk;
                  matchup.year = 2015;
                  if (Number(matchup.score1) > Number(matchup.score2)) {
                     matchup.winner = 1;
                  } else {
                     matchup.winner = 2;
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
               }
            });
         }
      });
   }
};
