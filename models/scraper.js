var request = require('request'),
fs = require('fs'),
cheerio = require('cheerio'),
Users = require('./dbschema').Users,
Bets = require('./dbschema').Bets,
Records = require('./dbschema').Records,
Scores = require('./dbschema').Scores,
Standings = require('./dbschema').Standings,
mongoose = require('mongoose');

var seasonStart = new Date(2016,8,8),
   nflWeeks = [],
   numWeeks = 22,
   daylight_savings_offset = 0;
for (var i=0;i<numWeeks;i++){
   if (i > 7)
      daylight_savings_offset = 3600000;
   nflWeeks.push(new Date(seasonStart.valueOf()+i*7*86400000+daylight_savings_offset));
}

var nflTeams = {'Atlanta': 'ATL', 'Arizona': 'ARI', 'Carolina': 'CAR', 'Chicago': 'CHI', 'Dallas': 'DAL', 'Detroit': 'DET', 'Green Bay': 'GB', 'Minnesota': 'MIN', 'New Orleans': 'NO', 'NY Giants': 'NYG', 'Philadelphia': 'PHI', 'Seattle': 'SEA', 'San Francisco': 'SF', 'Los Angelas': 'LAR', 'Tampa Bay': 'TB', 'Washington': 'WAS', 'Baltimore': 'BAL', 'Buffalo': 'BUF', 'Cincinatti': 'CIN', 'Cleveland': 'CLE', 'Denver': 'DEN', 'Houston': 'HOU', 'Kansas City': 'KC', 'Jacksonville': 'JAC', 'Indianapolis': 'IND', 'Miami': 'MIA', 'New England': 'NE', 'NY Jets': 'NYJ', 'Oakland': 'OAK', 'Pittsburgh': 'PIT', 'San Diego': 'SD', 'Tennessee': 'TEN'};

function getOdds(sport) {
   var url = 'http://www.oddsshark.com/'+sport+'/odds';
   // console.log('refeshing '+sport+' odds - '+new Date());
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
                  matchup.date = new Date(tempdate+' 2016 '+(Number(temptime[0])+Number((temptime[1].slice(-1) == 'p')?11:-1))+':'+temptime[1].slice(0,2));
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
         if (games.length) { // only write if something was found
            var success = fs.writeFileSync(sport+'_info.json',JSON.stringify(sendData));
         }
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

function updatePct (person) {
   Records.findOne({user: person, year: 2016, sport: 'nfl'}, function(err, record) {
      Records.update({_id: record._id}, {pct: (record.win+0.5*record.push)/(record.win+record.loss+record.push)}, function(err, resp){
         if (err)
            console.log('pct error');
      });
   });
}

function updateWinnerLoser(winner,loser,push){
	Records.update({user: winner, year: 2016},(push)?{$inc:{push:1}}:{$inc:{win:1}}, function(err){
		if (err)
			console.log(user+' had trouble updating wins - '+new Date());
		else if (!push)
			console.log(winner+' is winner - '+new Date());
      else
         console.log('push - '+new Date());
	});
   Records.update({user: loser, year: 2016},(push)?{$inc:{push:1}}:{$inc:{loss:1}},function(err){
		if (err)
			console.log(_id+' had trouble updating loser - '+new Date());
		else if (!push)
			console.log(loser+' is loser - '+new Date());
      else
         console.log('push - '+new Date());
	});
	updatePct(winner);
	updatePct(loser);
   if (!push) {
      Users.update({_id: winner}, {$inc:{debts:(1<<4)}}, function(err){
         if (err)
         console.log(user+' had trouble updating winner debts - '+new Date());
      });
      Users.update({_id: loser}, {$inc: {debts:1}}, function(err){
         if (err)
            console.log(user+' had trouble updating loser debts - '+new Date());
      });
   }
}

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
               team1: $(this).children().next().children().children().first().text(),
               team2: $(this).children().next().next().next().children().children().next().first().text()
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
      // console.log('checking scores ...');
      var url;
      if (sport=='nfl') {
         wk = module.exports.getWeek(new Date());
         url = 'http://www.oddsshark.com/stats/scoreboardbyweek/football/nfl/'+((wk>17)?((wk>18)?((wk>19)?'c':'d'):'w'):wk)+'/2016';
      } else {
         var today = new Date();
         url = 'http://www.oddsshark.com/nba/scores?date='+(today.getMonth()+1)+'/'+((today.getHours()>0)?today.getDate():today.getDate()-1)+'/'+today.getFullYear();
      }
      request(url, function (err, response, body) {
      	if(!err && response.statusCode == 200) {
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
                  // var period = ((sport=='nfl')?{week:wk}:{$and:[{date:{$gt:new Date().setHours(0,0)}}, {date:{$lt:new Date().setHours(23,59)}}]});
      				Scores.update({$and:[{sport:sport},
                                       {team1:tm1},
                                       {team2:tm2},
                                       {winner:0},
                                       ((sport=='nfl')?{week:wk}:{$and:[{date:{$gt:new Date().setHours(0,0)}}, {date:{$lt:new Date().setHours(23,59)}}]})]}, {score1: sc1, score2:sc2, winner:wnr},function(err, resp) {
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
      // below searches for unacted bets and marks refused after game starts; '-' are saved
      Bets.find({status:{$lte:0}}, function(err, bets){
      	bets.forEach(function(single){
            if (single.gametime < new Date()) {
               Bets.update({_id:single._id},{status:3}, function(err){
         			if(err)
         				console.log(err);
         			else
                     console.log(single.team1+'/'+single.team2+' game started - unacted changed to refused - '+new Date()+' gametime='+single.gametime);
   		      });
               Users.update({_id:single.user2},{$inc: {bets: -1}}, function(err){
                  if(err)
                     console.log(err);
               });
             }
      	});
      });
   },

   dailyCleaning: function(){
      // below searches for refused bets and deletes after 2 days
      Bets.remove({$or:[
                     {$and:[{status:3}, {date:{$lt:new Date()-1000*60*60*48}}]},
                     {$and:[{status:0}, {type: {$in: ['take', 'give']}}, {date:{$lt:new Date()}}]}]},
                      function(err){
			if(err)
				console.log(err);
			else
            console.log('Refused bets cleared - '+new Date());
      });
   },

   tallyBets: function(){
      // console.log('tallying bets ...');
      Bets.find({$and:[{status:2}, {sport:'nfl'}, {gametime:{$lt: new Date()}}]}, function(err, acceptedBets){  //find accepted bets
         acceptedBets.forEach(function(singleBet){				//go through each bet
            // console.log('found bet, looking for score');
            Scores.findOne({$and:[{sport: singleBet.sport}, //look for game bet is for
                              {winner:{$ne: 0}},
                              {$or:[{$and:[{team1: singleBet.team1.replace('@','')},
                                          {team2: singleBet.team2.replace('@','')}]},
                                    {$and:[{team1: singleBet.team2.replace('@','')},
                                          {team2: singleBet.team1.replace('@','')}]}]},
                              // {date:{$gt: singleBet.gametime.setHours(0,0)}},
                              // {date:{$lt: singleBet.gametime.setHours(23,59)}}]},
                              {week: singleBet.week},
                              {year: singleBet.year}]}, function(err, game){
   				if(err)
   					a(err);
   				else if (game) {
                  // console.log('found score');
                  if (singleBet.type == 'spread') {
   						if ((game.team1 == singleBet.team1.replace('@','') && game.score1+singleBet.odds > game.score2) ||
   						   (game.team2 == singleBet.team1.replace('@','') && game.score2+singleBet.odds > game.score1)) {
   							updateBet(singleBet.id,{status:4});
   							updateWinnerLoser(singleBet.user1,singleBet.user2,0);
   						} else if ((game.team1 == singleBet.team1.replace('@','') && game.score1+singleBet.odds < game.score2) ||
   						   (game.team2 == singleBet.team1.replace('@','') && game.score2+singleBet.odds < game.score1)) {
   							updateBet(singleBet.id,{status:5});
                        updateWinnerLoser(singleBet.user2,singleBet.user1,0);
   						} else {
   							updateBet(singleBet.id,{status:6});
                        updateWinnerLoser(singleBet.user1,singleBet.user2,1);
   						}
                  } else {
                     if ((singleBet.type == 'over' && game.score1+game.score2 > singleBet.odds) ||
                        (singleBet.type == 'under' && game.score1+game.score2 < singleBet.odds)) {
   							updateBet(singleBet.id,{status:4});
   							updateWinnerLoser(singleBet.user1,singleBet.user2,0);
                     } else if ((singleBet.type == 'under' && game.score1+game.score2 > singleBet.odds) ||
                        (singleBet.type == 'over' && game.score1+game.score2 < singleBet.odds)) {
                        updateBet(singleBet.id,{status:5});
   							updateWinnerLoser(singleBet.user2,singleBet.user1,0);
                     } else {
                        updateBet(singleBet.id,{status:6});
                        updateWinnerLoser(singleBet.user1,singleBet.user2,1);
                     }
                  }
   				}
      		});
      	});
      });
   },

   updateStandings: function(){
      var url = 'http://www.oddsshark.com/nba/ats-standings';
      request(url, function (err, response, body) {
         if(!err && response.statusCode == 200) {
            var $ = cheerio.load(body);

            var teams = ['Golden State','LA Clippers','San Antonio','Oklahoma City','Cleveland','Houston','Memphis','Atlanta','Chicago','New Orleans','Miami','Washington','Toronto','Milwaukee','Boston','Utah','Indiana','Phoenix','Detroit','Dallas','Sacramento','Orlando','Charlotte','New York','LA Lakers','Minnesota','Brooklyn','Portland','Denver','Philadelphia'];

            teams.forEach(function(name){
               var record = $('.base-table a:contains('+name+')').parent().next().text().split('-');
               var newproj = Number(record[0])/(Number(record[0])+Number(record[1]))*82;
               Standings.findOne({team: name}, function(err, rec) {
                  Standings.update({team: name}, {win: record[0], loss: record[1], projection: newproj, status: (newproj > rec.line)?'Over':'Under'}, function(err, resp){
                     if (err)
                        console.log('error');
                  });
               });
            });
            console.log('updated standings - '+new Date());
         }
      });
   },

   getScores: function(wk) {
      var url = 'http://www.oddsshark.com/stats/scoreboardbyweek/football/nfl/'+wk+'/2016';
      request(url, function (err, response, body) {
       	if(!err && response.statusCode == 200) {
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
                  matchup.year = 2016;
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
