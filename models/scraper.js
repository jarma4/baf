// const { resolve } = require('path');
const { isModuleNamespaceObject } = require('util/types');
const { Users, Records, Bets, Sports, OUgame, Odds, Tracker, Ats} = require('./dbschema');
const request = require('request'),
	fs = require('fs'),
	exec = require('child_process').exec,
	cheerio = require('cheerio'),
	logger = require('pino')({}, fs.createWriteStream('./json/log.json', {'flags': 'a'})),
	Util = require('./util');

function getOdds(sport) {
	const url = 'http://www.oddsshark.com/'+((sport=='soccer')?'soccer/world-cup':sport)+'/odds';
	// console.log(`checking odds ${sport} @ ${url}`);
	request(url, function (err, response, body) {
		if(!err && response.statusCode == 200) {
			const $ = cheerio.load(body);

			let  games = [];
			const today = new Date();
			// get matchup w/ team names & date
			$('.op-block__matchup-time').each((index, element)=>{
				const tempdate = JSON.parse($(element).parent().prevAll('.op-block__separator--left').attr('data-op-date')).short_date; //prevAll gives list, closest one is always last
				const temptime = $(element).text().split(':');
				games.push({date: new Date(tempdate+' '+((today.getMonth() == 11 && Util.monthName.indexOf(tempdate.split(' ')[1]) == 0)?today.getFullYear()+1:today.getFullYear())+' '+(Number(temptime[0])+Number((temptime[1].slice(-1) == 'p')?11:-1))+':'+temptime[1].slice(0,2))});
			});
			let gameIndex = 0;
			$('.md-hide','.op-block__matchup.'+((sport == 'nfl')?'football':(sport == 'nba')?'basketball':sport)).each((index, element)=>{
				if (index % 2) {
					games[gameIndex].team2 = '@'+$(element).text();
					gameIndex++;
				} else {
					games[gameIndex].team1 = $(element).text();
				}	 
			});
			// get odds for matchups 
			gameIndex = 0;
			$('.op-block__row','.op-block.odds').each((index, element) =>{
				let tmp = $(element).children().next().children().children();
				if ($(tmp).attr('data-op-info') != undefined && JSON.parse($(tmp).attr('data-op-info')).fullgame != '') {
					if (JSON.parse($(tmp).attr('data-op-info')).fullgame != 'Ev') {
						games[index].spread = Number(JSON.parse($(tmp).attr('data-op-info')).fullgame);
					}
					else {
						games[index].spread = 0;
					}
					games[index].firsthalf = Number(JSON.parse($(tmp).attr('data-op-info')).firsthalf);
					games[index].secondhalf = Number(JSON.parse($(tmp).attr('data-op-info')).secondhalf);
					games[index].over = Number(JSON.parse($(tmp).attr('data-op-total')).fullgame);
					games[index].moneyline1 = Number(JSON.parse($(tmp).attr('data-op-moneyline')).fullgame);
					games[index].moneyline2 = Number(JSON.parse($(tmp).parent().next().children().attr('data-op-moneyline')).fullgame);
				}
				gameIndex++;
			});			

			// go through odds Watches and act if necessary
			// console.log('checking watches');
			Bets.find({status:(sport == 'nfl')?10:(sport == 'nba')?11:12, $or:[{watch: 1},{watch: 11}]}, function(err, watches){
				watches.forEach(function(watch){
					// console.log(watch);
					// if home team was chosen, reverse things so they match current odds
					if(watch.team1.slice(0,1)=='@') {
						let tmp = watch.team1;
						watch.team1 = watch.team2;
						watch.team2 = tmp;
						watch.odds = 0 - watch.odds;
					}
					// watch found, look through current odds for match
					games.forEach(function(game) {
						if (watch.team1 == game.team1 && watch.team1 == game.team1 && watch.odds == game.spread) {
							// check if supposed to send bet to recipient after watch hits
							if (watch.watch == 11) {
								console.log('sending watch');
								delete watch.watch;
								delete watch.watchSend;
								watch.status = 0;
								let req = {};
								req.body = watch;
								// Api.makeBet(req);
							}
							// save watch as seen
							Bets.updateOne({_id: watch._id}, {watch: 2}, function(err){
								if(err)
									logger.error('trouble updating watch');
							});
							logger.info('*** Odds watch of '+watch.odds+' hit for '+watch.user1+' on '+watch.team1+' vs '+watch.team2);
							Util.textUser(watch.user1, 'Odds Watch: '+watch.team1+' vs '+watch.team2+' now has odds of '+watch.odds);
						}
					});
				});
			});

			let now = new Date();
			let sendData = {
				'time': now.getMonth()+1+'/'+now.getDate()+' '+now.getHours()+':'+('0'+now.getMinutes()).slice(-2),
				'week':  Util.getWeek(now, sport),
				'games': games};
			if (games.length) { // only write if something was found
				// console.log('writing to odds');
				let success = fs.writeFileSync('json/'+sport+'_odds.json',JSON.stringify(sendData));
			}
		}
	});
}

function updateBet(id,object){
	if (object.status == 6)  // special case for marking tie game
		object = {status:6, paid:true};
	Bets.updateOne({_id:id},{$set:object},function(err){
		if (err)
			logger.error(id+' had trouble updating - ');
		else
			logger.info(id+' bet updated - '+new Date());
	});
}

function updatePct (user, sport) {
	Records.findOne({user: user, sport: sport, season: Util.seasonStart[sport].getFullYear()}, function(err, record) {
		Records.updateOne({_id: record._id}, {pct: (record.win+0.5*record.push)/(record.win+record.loss+record.push)}, function(err, resp){
			if (err)
				console.log('pct error');
		});
	});
}

function updateRecord(user, category, sport, season) {
	return new Promise(function(resolve, reject){
		let result = {};
		result[category] = 1;
		Records.updateOne({'user': user, 'sport': sport, 'season': season},{$inc: result}, function(err, res){
			if (err) {
				logger.error(user+' had trouble updating wins - '+new Date());
				reject();
			} else {
				if (!res.modifiedCount){ // didn't actually update because no record, create one;
					// maybe error here, multiple new users created first time if multiple bets
					let newrecord = new Records({
						user: user,
						season: season,
						sport: sport,
						win: 0,
						loss: 0,
						push: 0,
						pct: 0
					});
					newrecord[category] = 1;
					newrecord.save(function(err){
						if(err) {
							console.log('error');
						}
					});
				}
				logger.info(user+' had a '+category+' - '+new Date());
				resolve();
			}
		});
		console.log('update result = ', result);
	});
}

function updateWinnerLoser(winner, loser, push, sport){
	updateRecord(winner, (push)?'push':'win', sport, Util.seasonStart[sport].getFullYear()).then(function(){
		updatePct(winner, sport);
	});
	updateRecord(loser, (push)?'push':'loss', sport, Util.seasonStart[sport].getFullYear()).then(function(){
		updatePct(loser, sport);
	});
	// update debt counters
	if (!push) {
		Users.updateOne({_id: winner}, {$inc:{debts:(1<<4)}}, function(err){
			if (err)
			logger.error(user+' had trouble updating winner debts - '+new Date());
		});
		Users.updateOne({_id: loser}, {$inc: {debts:1}}, function(err){
			if (err)
				logger.error(user+' had trouble updating loser debts - '+new Date());
		});
	}
}

module.exports = {
	refreshOddsInfo: function() {
		Sports.find({inseason: true}, (err, sports) => {
			if (!err){
				sports.forEach(sport => {
					getOdds(sport.sport);
				});
			}
		});
	},
	clearUnactedBets: function(){
		// below searches for unacted bets and marks refused after game starts; '-' are saved
		Bets.find({status:{$in:[0,10,11,12]}}, function(err, bets){
			bets.forEach(function(single){
				if (single.gametime < new Date()) {
					Bets.updateOne({_id:single._id},{status:3}, function(err){
						if(err)
							logger.error(err);
						else
							logger.info(single.team1+'/'+single.team2+' game started - unacted changed to refused - '+new Date()+' gametime='+single.gametime);
					});
					Users.updateOne({_id:single.user2},{$inc: {bets: -1}}, function(err){
						if(err)
							logger.error(err);
					});
				 }
			});
		});
	},

	dailyCleaning: function(){
		// below searches for refused bets and deletes after 2 days
		Bets.deleteMany({$or:[
							{$and:[{status:3}, {date:{$lt:new Date()-1000*60*60*48}}]},
							{$and:[{status:0}, {type: {$in: ['take', 'give']}}, {date:{$lt:new Date()}}]}]},
							 function(err){
			if(err)
				logger.error(err);
			else
				logger.info('Refused bets cleared - '+new Date());
		});
		// find bettors who haven't bet in a month and remove PCT so not to display in stats
		// Sports.find({inseason: true, sport: {$in: ['nfl', 'nba']}}, (err, sports) => {
		// 	if (!err){
		// 		let year; 
		// 		sports.forEach(sprt => {
		// 			year = sprt.start.getFullYear();
		// 			Records.find({season:year,sport:sprt.sport}, (err, players)=>{
		// 				if (!err) {
		// 					Bets.find({season:year,sport:sprt.sport, status: {$in: [4,5,6]}}, (err, bets)=>{
		// 						if (!err) {
		// 							const avgBets = bets.length - players.length;
		// 							players.forEach(player => {
		// 								Bets.findOne({season:year, sport:sprt.sport, $or:[{user1: player.user}, {user2: player.user}], status: {$in:[4,5,6]}}, (err, lastBet)=>{
		// 									if(!err){
		// 										if (lastBet.week <= Util.getWeek(new Date(), sprt.sport)-4) {
		// 											Records.update({season:year,sport:sprt.sport,user: player.user}, {$unset:{pct:1}}, (err, result)=>{
		// 												if (!err) {
		// 													console.log(`No bets for ${player.user} in month, clearing PCT`);
		// 												}
		// 											});
		// 										}
		// 									}
		// 								}).sort({date:-1});
		// 							});
		// 						}
		// 					});
		// 				}
		// 			});
		// 		});
		// 	}
		// });
	},

	tallyBets2: function(sprt){
		let teams, url, wk, today = new Date();
		let scores = {};
		
		if (today.getHours() === 0) {// for late games, if checking after midnight, need to look at previous day
			today.setHours(today.getHours()-1);
		}
		if (sprt=='nfl') {
			wk = Util.getWeek(new Date(), sprt);
			url = 'https://www.cbssports.com/nfl/scoreboard/all/'+Util.seasonStart.nfl.getFullYear()+((wk>17)?'/postseason/':'/regular/')+wk;
			teams = Util.nflTeams2;
		} else {
			url = 'https://www.cbssports.com/nba/scoreboard/'+today.getFullYear()+('0'+(today.getMonth()+1)).slice(-2)+('0'+today.getDate()).slice(-2);
			teams = Util.nbaTeams2;
		}
		// console.log(url);
		// first get scores for games today
		new Promise((resolve, reject) => {
			request(url, function (err, response, body) {
				if(!err && response.statusCode == 200) {
					const $ = cheerio.load(body);
					const scoresClass = $('.single-score-card.postgame');
					for (let idx = 0; idx < scoresClass.length; idx++){
						const matchup = $(scoresClass[idx]).find('a:nth-child(2)');
						scores[teams[matchup.first().text()]] = Number(matchup.first().parent().parent().find('td').last().text().replace(/\s/g,''));
						scores['@'+teams[matchup.last().text()]] = Number(matchup.last().parent().parent().find('td').last().text().replace(/\s/g,''));
					}
					resolve();
				}
			});
		})
		.then(()=>{
			// console.log(scores);
			// next go through accepted bets for the day
			Bets.find({$and:[{status:2}, {sport:sprt}, {gametime:{$lt: new Date()}}, {score1: 0}, {score2: 0}]}, (err, acceptedBets) => { //get all accepted bets
				acceptedBets.forEach(singleBet => {
					// console.log(`looking for ${singleBet}`);
					if (singleBet.type == 'spread' && scores[singleBet.team1] != undefined) {
						// console.log('found score for bet');
						if (scores[singleBet.team1]+singleBet.odds > scores[singleBet.team2]) {
							updateBet(singleBet.id,{status:4, score1: scores[singleBet.team1], score2: scores[singleBet.team2]});
							updateWinnerLoser(singleBet.user1, singleBet.user2, 0, singleBet.sport);
						} else if (scores[singleBet.team1]+singleBet.odds < scores[singleBet.team2]) {
							updateBet(singleBet.id,{status:5, score1: scores[singleBet.team1], score2: scores[singleBet.team2]});
							updateWinnerLoser(singleBet.user2, singleBet.user1, 0, singleBet.sport);
						} else {
							updateBet(singleBet.id,{status:6, score1: scores[singleBet.team1], score2: scores[singleBet.team2]});
							updateWinnerLoser(singleBet.user1, singleBet.user2, 1, singleBet.sport);
						}
					} else if (scores[singleBet.team1]) {
						// console.log(singleBet.type, singleBet.odds, scores[singleBet.team1]+scores[singleBet.team2])
						if (singleBet.type == 'over' && scores[singleBet.team1]+scores[singleBet.team2] > singleBet.odds || singleBet.type == 'under' && scores[singleBet.team1]+scores[singleBet.team2] < singleBet.odds) {
							updateBet(singleBet.id,{status:4, score1: scores[singleBet.team1], score2: scores[singleBet.team2]});
							updateWinnerLoser(singleBet.user1, singleBet.user2, 0, singleBet.sport);
						} else if (singleBet.type == 'over' && scores[singleBet.team1]+scores[singleBet.team2] < singleBet.odds || singleBet.type == 'under' && scores[singleBet.team1]+scores[singleBet.team2] > singleBet.odds) {
							updateBet(singleBet.id,{status:5, score1: scores[singleBet.team1], score2: scores[singleBet.team2]});
							updateWinnerLoser(singleBet.user2, singleBet.user1, 0, singleBet.sport);
						} else {
							updateBet(singleBet.id,{status:6, score1: scores[singleBet.team1], score2: scores[singleBet.team2]});
							updateWinnerLoser(singleBet.user1, singleBet.user2, 1, singleBet.sport);
						}
					}
				});
			});

			// finally go through ATS odds and mark
			Odds.find({season: Util.seasonStart[sprt].getFullYear(), sport: sprt, ats: 0, date: today.setHours(0,0,0,0)}, (err, odds)=>{
				// console.log('Updating Odds');
				if (err) {
					console.log('Error getting Odds when tallying ATS');
				} else {
					odds.forEach((game, idx) => {
						// console.log(scores[game.team1],Number(game.spread),scores[game.team2.replace('@','')])
						let winner = 0;
						if (scores[game.team1] + game.spread > scores[game.team2]) {
							winner = 1;
						} else if (scores[game.team1] + game.spread < scores[game.team2]) {
							winner = 2;
						} else if (scores[game.team1] + game.spread == scores[game.team2]){
							winner = 3;
						}
						if (winner) {
							Odds.updateOne({_id: game._id}, {ats: winner, total: scores[game.team1]+scores[game.team2]}, err => {
								if (err) {
									console.log('Error updating Odds winner when tallying ATS');
								} else {
									// console.log(game._id, winner, scores[game.team1]+scores[game.team2]);
								}
							});
						}
					});
					// see if end of day and do tally
					let promises = [];
					promises.push(new Promise((resolve, reject)=>{ // find number of games for today
						Odds.find({sport: sprt, bta: true, date: today}, (err, odds) => {
							if(err) {
								reject();
							} else {
								resolve(odds);
							}
						}).sort({index:1});
					}));
					promises.push(new Promise((resolve, reject)=>{ // find number of games done today
						Odds.find({sport: sprt, bta: true, date: today, ats: {$in:[1,2,3]}}, (err, done) => {
							if(err) {
								reject();
							} else {
								resolve(done.length);
							}
						}).sort({index:1});
					}));
					promises.push(new Promise((resolve, reject)=>{ // find BTA players for today
						Ats.find({sport: sprt, date: today}, (err, picks) => {
							if(err) {
								reject();
							} else {
								resolve(picks);
							}
						}).sort({user:1});
					}));
					Promise.all(promises).then(retData =>{
						// checki if any BTA today and if all done
						if (retData[2].length && (retData[0].length == retData[1])) { 
							let totals = new Array(retData[2].length).fill(0);
							retData[0].forEach((game, gameIndex) => {  // go through odds for all games
								retData[2].forEach((user, userIndex) => {  // get correct for each person
									if (Number(user[gameIndex])==game.ats) {
										totals[userIndex] += 1;
									}
								});
							});
							// increment record for each user with # of picks correct and # games
							retData[2].forEach((user, userIndex) => {
								Records.updateOne({season: Util.seasonStart[sprt].getFullYear(), sport: (sprt=='nfl')?'btanfl':'btanba', user: user.user}, {$inc:{games: 1, correct: totals[userIndex], try: retData[1]}}, err => { 
									if(err) {
										console.log('Error updating Record for user after BTA ended', err);
									} else {
										console.log(`BTA record updated for ${user.user}: ${totals[userIndex]} correct out of ${retData[1]}`);
									}
								});
							});
							// credit winner(s)
							const maxCorrect = Math.max(...totals);  //find highest # correct
							let winners = [], overallWinner = [];
							totals.filter((el, idx) => el == maxCorrect ? winners.push(idx):''); //store index of people that got maxCorrect
							const lastTotal = retData[0][retData[0].length-1].total; //find total on last game
							if (winners.length > 1) { // multiple winners, look at tiebreaker for each
								let bestDiff = 999;
								winners.forEach(userIndex=>{
									const currentDiff = Math.abs(retData[2][userIndex].tiebreaker - lastTotal);
									if (currentDiff < bestDiff) { // single winner
										overallWinner = [userIndex];
									} else if (currentDiff == bestDiff) { // multiple winners
										overallWinner.push(userIndex);
									}
									bestDiff = currentDiff;
								});								
							} else { // single winner
								overallWinner = winners;
							}
							overallWinner.forEach(idx => {
								Records.updateOne({season: Util.seasonStart[sprt].getFullYear(), sport: (sprt=='nfl')?'btanfl':'btanba', user: retData[2][idx].user}, {$inc: {win: 1/overallWinner.length}}, err => {
									if (err) {
										console.log(`Error incrementing BTA result for ${retData[2][idx].user}`);
									} else {
										console.log(`Updated BTA win for ${retData[2][idx].user} @ ${new Date()}`);
									}
								});
							});
							Odds.updateMany({date: today, ats: {$in:[1,2,3]}}, {$inc: {ats: 10}}, (err, done) => { 
								if(err) {
									console.log('Error marking done games', err);
								} else {
									console.log('Updated BTA odds to finished');
								}
							}).sort({index:1});
						}

					});
				}
			}).sort({index:1});
		});
	},
	updateStandings: function(sport){
		const url = 'http://www.oddsshark.com/'+sport+'/ats-standings';
		request(url, function (err, response, body) {
			if(!err && response.statusCode == 200) {
				const $ = cheerio.load(body);
				console.log('starting update '+sport);
				Object.keys((sport=='nfl')?Util.nflTeams:Util.nbaTeams).forEach(function(name){
               let record = $('.table a:contains('+name+')').parent().next().text().split('-');
               // console.log(name,record);
					let newproj = Number(record[0])/(Number(record[0])+Number(record[1]))*((sport=='nfl')?17:82);
					OUgame.findOne({sport: sport, season: Util.seasonStart[sport].getFullYear(), team: name}, function(err, rec) {
						if (err)
							logger.error('OUgame find team error: '+err);
						else if(rec) {
							OUgame.updateOne({sport:sport, season: Util.seasonStart[sport].getFullYear(), team: name}, {win: record[0], loss: record[1], projection: newproj, status: (Math.floor(newproj) > rec.line)?'Over':(Math.floor(newproj) < rec.line)?'Under':'Push'}, function(err, resp){
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
	markBack2Back: (sport) => {
		const tmpDate = new Date();
		console.log(`Checking Back2Back for ${tmpDate}`);
		const promises=[], away=[], home=[];
		promises.push(Odds.find({sport:sport, date: tmpDate.setHours(0,0,0,0), bta: {$exists: false}}, '-_id team1 team2'));
		promises.push(Odds.find({sport:sport, date:Util.previousDay(tmpDate), bta: {$exists: false}}, '-_id team1 team2'));
		Promise.all(promises).then(results => {
			results[0].forEach(today=>{
				results[1].forEach(yesterday =>{
					if(today.team1 == yesterday.team1 || today.team1 == yesterday.team2.slice[1]){
						away.push(today.team1);
					} else if (today.team2.slice(1) == yesterday.team1 || today.team2 == yesterday.team2) {
						home.push(today.team2);
					}
				});
			});
			console.log(away, home);
			away.forEach(team =>{
				console.log(team);
				Odds.updateOne({date: tmpDate,team1: team, bta: {$exists: false}}, {b2b1: true}, err =>{
					if (err) {
						console.log('Error updating B2B team1:',err);
					}
				});
			});
			home.forEach(team =>{
				Odds.updateOne({date: tmpDate,team2: team, bta: {$exists: false}}, {b2b2: true}, err =>{
					if (err) {
						console.log('Error updating B2B team2:',err);
					}
				});
			});
		});
	},
	getDailyOdds: (sport) => {
		let index = 0;
		const date = new Date();
		console.log(`getting daily odds ${date}`);
		const current = JSON.parse(fs.readFileSync('json/'+sport+'_odds.json'));
		current.games.forEach(game => {
			if (new Date(game.date).getDate() == date.getDate() && new Date(game.date).getMonth() == date.getMonth()) {  //only look at today, may include future odds
				new Odds({
					team1: game.team1,
					team2: game.team2,
					spread: game.spread,
					date: date.setHours(0,0,0,0),
					sport: sport,
					week: Util.getWeek(date, sport),
					season: Util.seasonStart[sport].getFullYear(),
					ats: 0,
					index: index++
				}).save(err => {
					if(err)
						console.log('Error saving new odds: '+err);
				});
			}
		});
		console.log(` - ${index} games today`);
	},
	processTracker: (sport) => {
		const date = Util.previousDay(new Date());
		date.setHours(0,0,0,0);  //set to midnight
		console.log(`Processing ${sport} Tracker for ${date}`);
		let promises = [];
		promises.push(Odds.find({sport: sport, date: date, bta: {$exists: false}}).sort({index:1}));
		promises.push(Ats.find({sport: 'tracker'+sport, date: date}).sort({user:1}));
		Promise.all(promises).then(results => {
			console.log(` - Found ${results[0].length} games`);
			results[0].forEach((game, index) => {
				// take care of overall(system) stats first
				Tracker.updateOne({user: 'system', team: game.team1, sport: sport, season: Util.seasonStart[sport].getFullYear()}, {$inc: {away_games: 1, away_won: (game.ats==1 || game.ats==11)?1:0, b2b_games: (game.b2b1)?1:0, b2b_won: (game.b2b1 && (game.ats==1 || game.ats==11))?1:0}}, err => {
					if(err) {
						console.log('Error updating system team1 Tracker: '+err);
					}
				});
				Tracker.updateOne({user: 'system', team: game.team2.slice(1), sport: sport, season: Util.seasonStart[sport].getFullYear()}, {$inc: {home_games: 1, home_won: (game.ats==2 || game.ats==12)?1:0, b2b_games: (game.b2b2)?1:0, b2b_won: (game.b2b2 && (game.ats==2 || game.ats==12))?1:0}}, err => {
					if(err) {
						console.log('Error updating system team2 Tracker: '+err);
					}
				});
				// next look at user trackers
				results[1].forEach(user => {
					if (user[index] != undefined){ //only mark if user has pick for game
						Tracker.updateOne({user: user.user, team: game.team1, sport: sport, season: Util.seasonStart[sport].getFullYear()}, {$inc: {away_games: 1, away_won: ((game.ats==1 || game.ats==11) && user[index] == 1)?1:0, b2b_games: (game.b2b1)?1:0, b2b_won: ((game.b2b1 && (game.ats==1 || game.ats==11)) && user[index] == 1)?1:0}}, err => {
							if(err) {
								console.log(`Error updating ${user.user} team1 Tracker: `+err);
							}
						});
						Tracker.updateOne({user: user.user, team: game.team2.slice(1), sport: sport, season: Util.seasonStart[sport].getFullYear()}, {$inc: {home_games: 1, home_won: ((game.ats==2 || game.ats==12) && user[index] == 2)?1:0, b2b_games: (game.b2b2)?1:0, b2b_won: ((game.b2b1 && (game.ats==2 || game.ats==12)) && user[index] == 2)?1:0}}, err => {
							if(err) {
								console.log(`Error updating ${user.user} team2 Tracker: `+err);
							}
						});	
					}
				});
			});
		});
	}
};
