var request = require('request'),
	fs = require('fs'),
	cheerio = require('cheerio'),
	logger = require('pino')({}, fs.createWriteStream('./json/log.json', {'flags': 'a'})),
	Util = require('./util'),
	Users = require('./dbschema').Users,
	Bets = require('./dbschema').Bets,
	Records = require('./dbschema').Records,
	Scores = require('./dbschema').Scores,
	OUgame = require('./dbschema').OUgame,
	Ats = require('./dbschema').Ats,
	Odds = require('./dbschema').Odds,
	Api = require('../routes/api');
	// mongoose = require('mongoose');

function getOdds(sport) {
	var url = 'http://www.oddsshark.com/'+((sport=='soccer')?'soccer/world-cup':sport)+'/odds';
	// console.log(url);
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
						matchup.date = new Date(tempdate+' '+new Date().getFullYear()+' '+(Number(temptime[0])+Number((temptime[1].slice(-1) == 'p')?11:-1))+':'+temptime[1].slice(0,2));
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
			Bets.find({status:(sport == 'nfl')?10:(sport == 'nba')?11:12, $or:[{watch: 1},{watch: 11}]}, function(err, watches){
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
							// check if supposed to send bet to recipient after watch hits
							if (watch.watch == 11) {
								watch.serial = Math.random();
								Api.makeBet(watch);
							}
							// save watch as seen
							Bets.update({_id: watch._id}, {watch: 2}, function(err){
								if(err)
									logger.error('trouble updating watch');
							});
							logger.info('*** Odds watch of '+watch.odds+' hit for '+watch.user1+' on '+watch.team1+' vs '+watch.team2);
							Util.textUser(watch.user1, 'Odds Watch: '+watch.team1+' vs '+watch.team2+' now has odds of '+watch.odds);
						}
					});
				});
			});

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
	if (object.status == 6)  // special case for marking tie game
		object = {status:6, paid:true};
	Bets.update({_id:id},{$set:object},function(err){
		if (err)
			logger.error(id+' had trouble updating - ');
		else
			logger.info(id+' bet updated - '+new Date());
	});
}

function updatePct (user, sport) {
	Records.findOne({user: user, sport: sport, season: 2018}, function(err, record) {
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
				logger.error(user+' had trouble updating wins - '+new Date());
				reject();
			} else {
				logger.info(user+' had a '+category+' - '+new Date());
				resolve();
			}
		});
	});
}

function updateWinnerLoser(winner, loser, push, sport){
	updateRecord(winner, (push)?'push':'win', sport, 2018).then(function(){
		updatePct(winner, sport);
	});
	updateRecord(loser, (push)?'push':'loss', sport, 2018).then(function(){
		updatePct(loser, sport);
	});
	// update debt counters
	if (!push) {
		Users.update({_id: winner}, {$inc:{debts:(1<<4)}}, function(err){
			if (err)
			logger.error(user+' had trouble updating winner debts - '+new Date());
		});
		Users.update({_id: loser}, {$inc: {debts:1}}, function(err){
			if (err)
				logger.error(user+' had trouble updating loser debts - '+new Date());
		});
	}
}

function addNflWeek (wk, yr, sprt) {
	var url = 'https://www.si.com/nfl/scoreboard?week=1%2C'+wk;
	request(url, function (err, response, body) {
		if(!err && response.statusCode === 200) {
			var $ = cheerio.load(body), pingpong = 0, team1;
			$('.team-name.desktop-name').each(function(){
				if (pingpong++%2) {
					new Scores({
						score1: 0,
						score2: 0,
						winner: 0,
						sport: sprt,
						season: yr,
						week: wk,
						team1: team1,
						team2: nflTeams2[$(this).text()]
					}).save(function(err){
						if(err) {
							logger.error('Trouble adding game');
						} else {
							logger.info('Week '+wk+' game added');
						}
					});
				} else {
					team1 = nflTeams2[$(this).text()];
				}
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
				console.log(nbaTeams2[$(this).find('.team-name').first().text()]+' vs '+nbaTeams2[$(this).find('.team-name').last().text()]);
				var tmp = new Scores({
					score1: 0,
					score2: 0,
					winner: 0,
					season: 2018,
					sport: 'nba',
					date: dateCopy,
					team1: nbaTeams2[$(this).find('.team-name').first().text()],
					team2: nbaTeams2[$(this).find('.team-name').last().text()]
				}).save(function(err){
					if(err) {
						console.log('Trouble adding game');
					} else {
						console.log('game added');
					}
				});
			});
		}
	});
}

module.exports = {
	refreshOddsInfo: function() {
		getOdds('nfl');
		getOdds('nba');
	},

	checkScores: function(sport) {
		var url, today = new Date();
		// for late games, checking after midnight need to look at previous day
		if (today.getHours() === 0)
			today.setHours(today.getHours()-1);
		if (sport=='nfl') {
			wk = Util.getWeek(new Date(), sport);
			url = 'http://www.oddsshark.com/stats/scoreboardbyweek/football/nfl/'+((wk>17)?((wk>18)?((wk>19)?'c':'d'):'w'):wk)+'/2018';
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
													((sport=='nfl')?{week:wk}:{$and:[{date:{$gte:today.setHours(0,0,0,0)}}, {date:{$lt:today.setHours(23,59)}}]})]}, {score1: sc1, score2:sc2, winner:(Number(sc1) > Number(sc2))?1:2},function(err, resp) {
							if (err)
								logger.error('checkScores error: '+err);
							if (resp.n)
								logger.info(sport+': final score for '+tm1+'/'+tm2+' changed '+today);
						});
					}
				});
			}
		});
	},

	clearUnactedBets: function(){
		// below searches for unacted bets and marks refused after game starts; '-' are saved
		Bets.find({status:{$in:[0,10,11,12]}}, function(err, bets){
			bets.forEach(function(single){
				if (single.gametime < new Date()) {
					Bets.update({_id:single._id},{status:3}, function(err){
						if(err)
							logger.error(err);
						else
							logger.info(single.team1+'/'+single.team2+' game started - unacted changed to refused - '+new Date()+' gametime='+single.gametime);
					});
					Users.update({_id:single.user2},{$inc: {bets: -1}}, function(err){
						if(err)
							logger.error(err);
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
				logger.error(err);
			else
				logger.info('Refused bets cleared - '+new Date());
		});
	},

	tallyBets: function(sprt){
		// console.log('tallying bets ...'+sprt);
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
										{$or:[{$and:[{date:{$gte: singleBet.gametime.setHours(0,0,0,0)}},
														{date:{$lt: singleBet.gametime.setHours(23,59)}}]},
												{week: singleBet.week}]},
										{season: singleBet.season}]}, function(err, game){
						if(err)
								logger.error('tallyBets error: '+err);
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

	updateStandings: function(sport){
		const url = 'http://www.oddsshark.com/'+sport+'/ats-standings';
		request(url, function (err, response, body) {
			if(!err && response.statusCode == 200) {
				const $ = cheerio.load(body);
				// console.log('starting update '+sport);
				Object.keys((sport=='nfl')?nflTeams:nbaTeams).forEach(function(name){
					var record = $('.base-table a:contains('+name+')').parent().next().text().split('-');
					var newproj = Number(record[0])/(Number(record[0])+Number(record[1]))*((sport=='nfl')?16:82);
					OUgame.findOne({sport: sport, season: 2018, team: name}, function(err, rec) {
						if (err)
							logger.error('OUgame find team error: '+err);
						else if(rec) {
							OUgame.update({sport:sport, season: 2018, team: name}, {win: record[0], loss: record[1], projection: newproj, status: (newproj > rec.line)?'Over':(newproj < rec.line)?'Under':'Push'}, function(err, resp){
								if (err)
									logger.error('updateStandings error: '+err);
							});
						}
					});
				});
				logger.info('updated standings - '+new Date());
			}
		});
	},

	addNflGames: function(start, end, year) {
		for(let wk = start; wk <= end; wk++){
			addNflWeek(wk, year, 'nfl');
		}
	},
	
	addNbaGames: function(startDate, endDate) {
		while (startDate <= endDate) {
			addNbaGame(startDate);
			startDate.setDate(startDate.getDate()+1);
		}
	},

	initOUgame: function(season, sport) {
		var i = 0;
		for (var team in (sport == 'nfl')?nflTeams:nbaTeams) {
			var tmp = new OUgame ({
				sport: sport,
				season: season,
				team: team,
				index: i++,
				win: 0,
				loss: 0,
				line: 0,
				projection: 0,
				status: 'U'
			}).save(function(err){
				if(err) {
					console.log('Trouble adding OUgame team');
				} else {
					console.log('OUgame added '+team);
				}
			});
		}
	},
	addAtsScores: function(season, week){
		Odds.find({season: season, sport: 'nfl', week: week, ats: 0}, (err, games) => {
			if (err) {
				console.log('Error reading Odds: '+err);
			} else {
				games.forEach(game => {
					Scores.findOne({season: season, sport: 'nfl', week: week, winner: {$ne:0}, team1: game.team1, team2: game.team2.replace('@','')}, (err, score) => {
                  if (score) {
                     let ats;
                     if (score.score1 + game.spread > score.score2)
                        ats = 1;
                     else if (score.score1 + game.spread < score.score2)
                        ats = 2;
                     else
								ats = 3;
							console.log(`${game.team1} ${game.team2} ${ats}`);
                     Odds.update({season: season, sport: 'nfl', week: week, team1: game.team1, team2: game.team2}, {ats: ats}, err =>{
                        if (err)
                           console.log('Problem updating Odds ats: '+err);
                        else
                           console.log('Updated Odds ats');
                     });
                     // console.log(`${score.team1}(${game.spread}) ${score.score1} ${score.team2} ${score.score2} -- ${ats}`);
                  }
					});
				});
			}
		});
	},
	publishAtsOdds: function() {
		let index = 0;
      let current = JSON.parse(fs.readFileSync('json/nfl_odds.json'));
      current.games.forEach(game => {
         if (Util.getWeek(new Date(game.date), 'nfl') == Util.getWeek(new Date(), 'nfl')) {
            new Odds({
               team1: game.team1,
               team2: game.team2,
               spread: game.spread,
               date: game.date,
               sport: 'nfl',
               week: Util.getWeek(new Date(), 'nfl'),
               season: 2018,
               index: index++
            }).save(err => {
               if(err)
                  console.log('Error saving: '+err);
            });
         }
      });
		console.log('Copied ATS odds for week');
	},
	getAts: (season, week) => {
		return new Promise((resolve, reject) => {
			let results = [], playerPromises = [];
			Ats.find({season: season, week: week}, {'user': 1, '0': 1, '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, '8': 1, '9': 1, '10': 1, '11': 1, '12': 1, '13': 1, '14': 1, '15': 1}, (err, players) => {
				if (err) {
					console.log("Test error: "+err);
				} else {
					playerPromises.push(new Promise((resolve, reject) =>{
							players.forEach(choices => {
								let index=0, score = 0, choicesPromises=[];
								for (let key in choices.toObject()) {
									if(key != '_id' && key != 'user') {
										choicesPromises.push(Odds.findOne({sport:'nfl', season: season, week: week, index: key}, (err, result) => {
											if(result){
												if(choices[key] == result.ats) {
													++score;
												}
											}
										}));
									}
								}
								Promise.all(choicesPromises).then(() => {
									results.push({user: choices.user, win: score});
									resolve();
								});
							});
					}));
					Promise.all(playerPromises).then(() => {
						resolve(results);
					});
				}
			}).sort({user:1});
		});
	},
	tallyAts: (season, week) => {
		module.exports.getAts(season, week).then(results => {
         results.forEach(record => {
            Records.update({season: season, sport: 'ats', user: record.user}, {$inc:{win: record.win}}, err => {
               console.log('updating record');
               if (err)
                  console.log('Error incrementing ATS record: '+err);
            });
         });
      });
	}
};

var nflTeams = {
		'Arizona': 'ARI', 'Atlanta': 'ATL', 'Baltimore': 'BAL', 'Buffalo': 'BUF', 'Carolina': 'CAR', 'Chicago': 'CHI', 'Cincinnati': 'CIN', 'Cleveland': 'CLE', 'Dallas': 'DAL', 'Denver': 'DEN', 'Detroit': 'DET', 'Green Bay': 'GB', 'Houston': 'HOU', 'Indianapolis': 'IND', 'Jacksonville': 'JAC', 'Kansas City': 'KC', 'LA Chargers': 'LAC', 'LA Rams': 'LAR', 'Miami': 'MIA', 'Minnesota': 'MIN', 'NY Giants': 'NYG', 'NY Jets': 'NYJ', 'New England': 'NE', 'New Orleans': 'NO', 'Oakland': 'OAK', 'Philadelphia': 'PHI', 'Pittsburgh': 'PIT', 'San Francisco': 'SF', 'Seattle': 'SEA', 'Tampa Bay': 'TB', 'Tennessee': 'TEN', 'Washington': 'WAS'},
	nflTeams2 = {
		'Cardinals': 'ARI', 'Falcons': 'ATL', 'Ravens': 'BAL', 'Bills': 'BUF', 'Panthers': 'CAR', 'Bears': 'CHI', 'Bengals': 'CIN', 'Browns': 'CLE', 'Cowboys': 'DAL', 'Broncos': 'DEN', 'Lions': 'DET', 'Packers': 'GB', 'Texans': 'HOU', 'Colts': 'IND', 'Jaguars': 'JAC', 'Chiefs': 'KC', 'Chargers': 'LAC', 'Rams': 'LAR', 'Dolphins': 'MIA', 'Vikings': 'MIN', 'Giants': 'NYG', 'Jets': 'NYJ', 'Patriots': 'NE', 'Saints': 'NO', 'Raiders': 'OAK', 'Eagles': 'PHI', 'Steelers': 'PIT', '49ers': 'SF', 'Seahawks': 'SEA', 'Buccaneers': 'TB', 'Titans': 'TEN', 'Redskins': 'WAS'},
	nbaTeams = {
		'Atlanta': 'ATL', 'Boston': 'BOS', 'Brooklyn': 'BKN', 'Charlotte': 'CHR', 'Chicago': 'CHI', 'Cleveland': 'CLE', 'Dallas': 'DAL', 'Denver': 'DEN', 'Detroit': 'DET', 'Golden State': 'GS', 'Houston': 'HOU', 'Indiana': 'IND', 'LA Clippers': 'LAC','LA Lakers': 'LAL', 'Memphis': 'MEM', 'Miami': 'MIA', 'Milwaukee': 'MIL', 'Minnesota': 'MIN', 'New Orleans': 'NOP', 'New York': 'NY', 'Oklahoma City': 'OKC', 'Orlando': 'ORL', 'Philadelphia': 'PHI', 'Phoenix': 'PHO', 'Portland': 'POR', 'Sacramento': 'SAC', 'San Antonio': 'SAN', 'Toronto': 'TOR', 'Utah': 'UTA', 'Washington': 'WAS', },
	nbaTeams2 = {
		'Hawks': 'ATL', 'Bulls': 'CHI', 'Mavericks': 'DAL', 'Pistons': 'DET',  'Timberwolves': 'MIN', 'Pelicans': 'NOH', 'Knicks': 'NY', 'Nets': 'BKN', '76ers': 'PHI', 'Thunder': 'OKC', 'Clippers': 'LAC','Lakers': 'LAL', 'Wizards': 'WAS', 'Cavaliers': 'CLE', 'Nuggets': 'DEN', 'Rockets': 'HOU', 'Pacers': 'IND', 'Heat': 'MIA', 'Celtics': 'BOS', 'Warriors': 'GS', 'Golden State': 'GS', 'Spurs': 'SAN', 'Kings': 'SAC', 'Trail Blazers': 'POR', 'Magic': 'ORL', 'Hornets': 'CHR', 'Suns': 'PHO', 'Raptors': 'TOR', 'Bucks': 'MIL', 'Jazz': 'UTA', 'Grizzlies': 'MEM'};
