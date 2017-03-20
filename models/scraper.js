var request = require('request'),
   fs = require('fs'),
   cheerio = require('cheerio'),
   Util = require('./util'),
   Users = require('./dbschema').Users,
   Bets = require('./dbschema').Bets,
   Records = require('./dbschema').Records,
   Scores = require('./dbschema').Scores,
   Ougame = require('./dbschema').Ougame,
   mongoose = require('mongoose');

var nflTeams = {'Atlanta': 'ATL', 'Arizona': 'ARI', 'Carolina': 'CAR', 'Chicago': 'CHI', 'Dallas': 'DAL', 'Detroit': 'DET', 'Green Bay': 'GB', 'Minnesota': 'MIN', 'New Orleans': 'NO', 'NY Giants': 'NYG', 'Philadelphia': 'PHI', 'Seattle': 'SEA', 'San Francisco': 'SF', 'Los Angelas': 'LAR', 'Tampa Bay': 'TB', 'Washington': 'WAS', 'Baltimore': 'BAL', 'Buffalo': 'BUF', 'Cincinatti': 'CIN', 'Cleveland': 'CLE', 'Denver': 'DEN', 'Houston': 'HOU', 'Kansas City': 'KC', 'Jacksonville': 'JAC', 'Indianapolis': 'IND', 'Miami': 'MIA', 'New England': 'NE', 'NY Jets': 'NYJ', 'Oakland': 'OAK', 'Pittsburgh': 'PIT', 'San Diego': 'SD', 'Tennessee': 'TEN'},
   nbaTeams = {'Atlanta': 'ATL', 'Chicago': 'CHI', 'Dallas': 'DAL', 'Detroit': 'DET', 'Minnesota': 'MIN', 'New Orleans': 'NOH', 'New York': 'NY', 'Brooklyn': 'BKN', 'Philadelphia': 'PHI', 'Oklahoma City': 'OKC', 'L.A. Clippers': 'LAC','L.A. Lakers': 'LAL', 'Washington': 'WAS', 'Cleveland': 'CLE', 'Denver': 'DEN', 'Houston': 'HOU', 'Indiana': 'IND', 'Miami': 'MIA', 'Boston': 'BOS', 'Golden St.': 'GS', 'Golden State': 'GS', 'San Antonio': 'SAN', 'Sacramento': 'SAC', 'Portland': 'POR', 'Orlando': 'ORL', 'Charlotte': 'CHR', 'Phoenix': 'PHO', 'Toronto': 'TOR', 'Milwaukee': 'MIL', 'Utah': 'UTA', 'Memphis': 'MEM'},
   nbaTeams2 = {'Hawks': 'ATL', 'Bulls': 'CHI', 'Mavericks': 'DAL', 'Pistons': 'DET', 'Timberwolves': 'MIN', 'Pelicans': 'NOH', 'Knicks': 'NY', 'Nets': 'BKN', '76ers': 'PHI', 'Thunder': 'OKC', 'Clippers': 'LAC','Lakers': 'LAL', 'Wizards': 'WAS', 'Cavaliers': 'CLE', 'Nuggets': 'DEN', 'Rockets': 'HOU', 'Pacers': 'IND', 'Heat': 'MIA', 'Celtics': 'BOS', 'Warriors': 'GS', 'Golden State': 'GS', 'Spurs': 'SAN', 'Kings': 'SAC', 'Trail Blazers': 'POR', 'Magic': 'ORL', 'Hornets': 'CHR', 'Suns': 'PHO', 'Raptors': 'TOR', 'Bucks': 'MIL', 'Jazz': 'UTA', 'Grizzlies': 'MEM'};

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
         // go through odds Watches and act if necessary
         Bets.find({status:(sport == 'nfl')?10:11, watch: 1}, function(err, watches){
            watches.forEach(function(watch){
               // if home team was chosen, reverse things so they match current odds
               if(watch.team1.slice(0,1)=='@') {
                  var tmp = watch.team1;
                  watch.team1 = watch.team2;
                  watch.team2 = tmp;
                  watch.odds = 0 - watch.odds;
               }
               // watch found, look through current odds for match
               games.forEach(function(game) {
                  if (watch.team1 == game.team1 && watch.team1 == game.team1 && watch.odds == game.spread) {
                     // save watch as seen
                     Bets.update({_id: watch._id}, {watch: 2}, function(err){
                        if(err)
                           console.log('trouble updating watch');
                     });
                     console.log('*** Odds watch of '+watch.odds+' hit for'+watch.team1+' vs '+watch.team2);
                     Util.textUser(watch.user1, 'Odds Watch: '+watch.team1+' vs '+watch.team2+' now has odds of '+watch.odds);

                  }
               });
            });
         });

         // add special game bets
         // if(fs.existsSync('json/extra.json') && sport == 'nfl') {
         //    var extraGames = JSON.parse(fs.readFileSync('json/extra.json','utf8'));
         //    extraGames.games.forEach(function(game){
         //       games.unshift(game);
         //    });
         // }
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

function updateBet(id,object){
	Bets.update({_id:id},{$set:object},function(err){
		if (err)
			console.log(id+' had trouble updating - ');
		else
			console.log(id+' bet updated - '+new Date());
	});
}

function updatePct (user, sport) {
   Records.findOne({user: user, sport: sport, season: 2016}, function(err, record) {
      Records.update({_id: record._id}, {pct: (record.win+0.5*record.push)/(record.win+record.loss+record.push)}, function(err, resp){
         if (err)
            console.log('pct error');
      });
   });
}

function updateRecord(user, category, sport, season) {
   return new Promise(function(resolve, reject){
      var temp = {};
      temp[category] = 1;
      Records.update({'user': user, 'sport': sport, 'season': season},{$inc: temp}, function(err){
   		if (err) {
   			console.log(user+' had trouble updating wins - '+new Date());
            reject();
   		} else {
   			console.log(user+' had a '+category+' - '+new Date());
            resolve();
         }
   	});
   });
}

function updateWinnerLoser(winner, loser, push, sport){
   updateRecord(winner, (push)?'push':'win', sport, 2016).then(function(){
      updatePct(winner, sport);
   });
   updateRecord(loser, (push)?'push':'loss', sport, 2016).then(function(){
      updatePct(loser, sport);
   });
   // update debt counters
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

function addNflGame (wk, yr, sprt) {
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
               season: yr,
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

function addNbaGame(date) {
   var url = 'http://www.si.com/nba/scoreboard?date='+date.getFullYear()+'-'+('0'+(date.getMonth()+1)).slice(-2)+'-'+('0'+date.getDate()).slice(-2),
       dateCopy = new Date(date);
   console.log(url);
   request(url, function (err, response, body) {
      if(!err && response.statusCode === 200) {
         var $ = cheerio.load(body);
         $('.game').each(function(){
            var tmp = new Scores({
               score1: 0,
               score2: 0,
               winner: 0,
               season: 2016,
               sport: 'nba',
               date: dateCopy,
               team1: nbaTeams2[$(this).find('.team-name').first().text()],
               team2: nbaTeams2[$(this).find('.team-name').last().text()]
            }).save(function(err){
               if(err) {
                  console.log('Trouble adding game');
               } else {
                  console.log(tmp.team1 + ' vs ' + tmp.team2 +' game added');
               }
            });
         });
      }
   });
}

module.exports = {
   refreshOddsInfo: function() {
      getOdds('ncaab');
      getOdds('nba');
   },

   checkScores: function(sport) {
      var url, today = new Date();
      // for late games, checking after midnight need to look at previous day
      if (today.getHours() === 0)
         today.setHours(today.getHours()-1);
      if (sport=='nfl') {
         wk = Util.getWeek(new Date(), sport);
         url = 'http://www.oddsshark.com/stats/scoreboardbyweek/football/nfl/'+((wk>17)?((wk>18)?((wk>19)?'c':'d'):'w'):wk)+'/2016';
      } else {
         url = 'http://www.si.com/nba/scoreboard?date='+today.getFullYear()+'-'+('0'+(today.getMonth()+1)).slice(-2)+'-'+('0'+today.getDate()).slice(-2);
      }
      // console.log('checking scores @ '+url);
      request(url, function (err, response, body) {
      	if(!err && response.statusCode == 200) {
      		var $ = cheerio.load(body);
            var selector;
            if (sport == 'nfl')
               selector = '.date.last';
            else
               selector = '.final';
            $(selector).each(function(){
               if ($(this).text().indexOf('Final') >= 0) {
                  if (sport == 'nfl') {
                     tm1 = $(this).parent().next().next().children().first().text();
                     sc1 = $(this).parent().next().next().children('.scores-data.last').text();
                     tm2 = $(this).parent().next().next().next().children().first().text();
                     sc2 = $(this).parent().next().next().next().children('.scores-data.last').text();
                  } else {
                     tm1 = nbaTeams2[$(this).find('.team-name').first().text()];
                     sc1 = $(this).find('.team-score').first().text().replace(/\s/g,'');
                     tm2 =nbaTeams2[$(this).find('.team-name').last().text()];
                     sc2 = $(this).find('.team-score').last().text().replace(/\s/g,'');
                  }
                  // console.log(tm1+':'+sc1+' '+tm2+':'+sc2);
                  Scores.update({$and:[{sport:sport},
                                       {team1:tm1},
                                       {team2:tm2},
                                       {winner:0},
                                       ((sport=='nfl')?{week:wk}:{$and:[{date:{$gt:today.setHours(0,0)}}, {date:{$lt:today.setHours(23,59)}}]})]}, {score1: sc1, score2:sc2, winner:(Number(sc1) > Number(sc2))?1:2},function(err, resp) {
                     if (err)
                        console.log('checkScores error: '+err);
                     if (resp.n)
                        console.log(sport+': final score for '+tm1+'/'+tm2+' changed '+today);
                  });
               }
            });
         }
      });
   },

   clearUnactedBets: function(){
      // below searches for unacted bets and marks refused after game starts; '-' are saved
      Bets.find({status:{$in:[0,10,11]}}, function(err, bets){
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

   tallyBets: function(sprt){
      // console.log('tallying bets ...');
      Bets.find({$and:[{status:2}, {sport:sprt}, {gametime:{$lt: new Date()}}]}, function(err, acceptedBets){  //find accepted bets
         acceptedBets.forEach(function(singleBet){				//go through each bet
            // console.log('found bet, looking for '+singleBet.team1+ ' '+singleBet.team2+ ' '+singleBet.season);
            // console.log(singleBet);
            Scores.findOne({$and:[{sport: singleBet.sport}, //look for game bet is for
                              {winner:{$ne: 0}},
                              {$or:[{$and:[{team1: singleBet.team1.replace('@','')},
                                          {team2: singleBet.team2.replace('@','')}]},
                                    {$and:[{team1: singleBet.team2.replace('@','')},
                                          {team2: singleBet.team1.replace('@','')}]}]},
                              {$or:[{$and:[{date:{$gt: singleBet.gametime.setHours(0,0)}},
                                          {date:{$lt: singleBet.gametime.setHours(23,59)}}]},
                                    {week: singleBet.week}]},
                              {season: singleBet.season}]}, function(err, game){
   				if(err)
   					console.log('tallyBets error: '+err);
   				else if (game) {
                  // console.log('found score');
                  if (singleBet.type == 'spread') {
   						if ((game.team1 == singleBet.team1.replace('@','') && game.score1+singleBet.odds > game.score2) ||
   						   (game.team2 == singleBet.team1.replace('@','') && game.score2+singleBet.odds > game.score1)) {
   							updateBet(singleBet.id,{status:4});
   							updateWinnerLoser(singleBet.user1, singleBet.user2, 0, singleBet.sport);
   						} else if ((game.team1 == singleBet.team1.replace('@','') && game.score1+singleBet.odds < game.score2) ||
   						   (game.team2 == singleBet.team1.replace('@','') && game.score2+singleBet.odds < game.score1)) {
   							updateBet(singleBet.id,{status:5});
                        updateWinnerLoser(singleBet.user2, singleBet.user1, 0, singleBet.sport);
   						} else {
   							updateBet(singleBet.id,{status:6});
                        updateWinnerLoser(singleBet.user1, singleBet.user2, 1, singleBet.sport);
   						}
                  } else {
                     if ((singleBet.type == 'over' && game.score1+game.score2 > singleBet.odds) ||
                        (singleBet.type == 'under' && game.score1+game.score2 < singleBet.odds)) {
   							updateBet(singleBet.id,{status:4});
   							updateWinnerLoser(singleBet.user1, singleBet.user2, 0, singleBet.sport);
                     } else if ((singleBet.type == 'under' && game.score1+game.score2 > singleBet.odds) ||
                        (singleBet.type == 'over' && game.score1+game.score2 < singleBet.odds)) {
                        updateBet(singleBet.id,{status:5});
   							updateWinnerLoser(singleBet.user2, singleBet.user1, 0, singleBet.sport);
                     } else {
                        updateBet(singleBet.id,{status:6});
                        updateWinnerLoser(singleBet.user1, singleBet.user2, 1, singleBet.sport);
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
               Ougame.findOne({team: name}, function(err, rec) {
                  if (err)
                     console.log('Ougame find team error: '+err);
                  else if(rec) {
                     Ougame.update({team: name}, {win: record[0], loss: record[1], projection: newproj, status: (newproj > rec.line)?'Over':'Under'}, function(err, resp){
                        if (err)
                           console.log('updateStandings error: '+err);
                     });
                  }
               });
            });
            console.log('updated standings - '+new Date());
         }
      });
   },

   addNbaGames: function(startDate, endDate) {
      while (startDate <= endDate) {
         addNbaGame(startDate);
         startDate.setDate(startDate.getDate()+1);
      }
   }
};
