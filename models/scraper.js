// const { resolve } = require('path');
const { isModuleNamespaceObject } = require('util/types');
const { Users, Records, Bets, Sports, OUgame, Odds, Tracker, Ats} = require('./dbschema');
const { dailyB2b } = require('./util');
const request = require('request'),
	fs = require('fs'),
	exec = require('child_process').exec,
	cheerio = require('cheerio'),
	logger = require('pino')({}, fs.createWriteStream('./json/log.json', {'flags': 'a'})),
	Util = require('./util');

function getOdds(sport) {
	
	function changeTime(time){ // time is in ET
		const timeSplit=time.slice(0,-2).split(':');
		return String(Number(timeSplit[0])+((time.slice(-2)=='pm')?11:-1)+':'+timeSplit[1]);
	}

	const options = {
		url: 'https://www.vegasinsider.com/'+sport+'/odds/las-vegas/',
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
		}
	}
	// const url = 'https://www.mybookie.ag/sportsbook/'+((sport=='soccer')?'soccer/world-cup':sport)+((sport=='nfl')?'-usa/':'/');
	// console.log(`checking odds ${sport} @ ${options.url}`);
	request(options, async (err, response, body) => {
		if(!err && response.statusCode == 200) {
			// get odds for teams
			let  games = [];
			// const today = new Date();
			const $ = cheerio.load(body);
			// const matchups = $('.game-line[itemtype="http://schema.org/Event"] .game-line__home-line');
			const visitor = $('.divided');
			const home = $('.footer');
			for (let idx = 0; idx < visitor.length/3; idx++){
				if ($(visitor[idx]).prev().find('span').data('value') != undefined){ // not old/final
					games.push({
						date: new Date($(visitor[idx]).prev().find('span').data('value')),
						team1: $(visitor[idx]).find('.team-name').data('abbr'),
						team2: '@'+$(home[idx]).find('.team-name').data('abbr'),
						spread: Number($(visitor[idx]).find('.game-odds:nth-child(6)').text().trim().split('   ')[0]),  // caesars
						over: Number($(visitor[idx+(visitor.length/3)]).find('.game-odds:nth-child(6)').text().trim().split('   ')[0].substring(1))
					});
				}
			}

			// go through odds Watches and act if necessary
			// console.log('checking watches');
			Bets.find({status:(sport == 'nfl')?10:(sport == 'nba')?11:12, $or:[{watch: 1},{watch: 11}]})
			.then ((watches) => {
				watches.forEach(watch => {
					// console.log(watch);
					// if home team was chosen, reverse things so they match current odds
					if(watch.team1.slice(0,1)=='@') {
						let tmp = watch.team1;
						watch.team1 = watch.team2;
						watch.team2 = tmp;
						watch.odds = 0 - watch.odds;
					}
					// watch found, look through current odds for match
					games.forEach(async (game) => {
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
							Bets.updateOne({_id: watch._id}, {watch: 2})
							.catch(err => logger.error('trouble updating watch'));
							logger.info('*** Odds watch of '+watch.odds+' hit for '+watch.user1+' on '+watch.team1+' vs '+watch.team2);
							Util.sendSlack(watch.user1, 'Odds Watch: '+watch.team1+' vs '+watch.team2+' now has odds of '+watch.odds);
						}
					});
				});
			})
			.catch (err => console.log(err));

			const now = new Date();
			const sendData = {
				'time': now.getMonth()+1+'/'+now.getDate()+' '+now.getHours()+':'+('0'+now.getMinutes()).slice(-2),
				'week':  Util.getWeek(now, sport),
				'games': games};
			if (games.length) { // only write if something was found
				// console.log('writing to odds');
				const success = fs.writeFileSync('json/'+sport+'_odds.json',JSON.stringify(sendData));
			}
		} else {
			console.log(`Error in getodds: ${err}`)
		}
	});
}

function updateBet(id, object){
	if (object.status == 6)  // special case for marking tie game
		object = {status:6, paid:true};
	Bets.updateOne({_id:id},{$set:object})
	.then (() => logger.info(id+' bet updated - '+new Date()))
	.catch(err => logger.error(id+' had trouble updating: ',err));
}

function updatePct (user, sport) {
	Records.findOne({user: user, sport: sport, season: Util.seasonStart[sport].getFullYear()})
	.then((record) => {
		Records.updateOne({_id: record._id}, {pct: (record.win+0.5*record.push)/(record.win+record.loss+record.push)})
		.catch(err => console.log('pct error'));
	})
	.catch(err => console.log(err));
}

function updateRecord(user, category, sport, season) {
	return new Promise((resolve, reject) => {
		let result = {};
		result[category] = 1;
		Records.updateOne({'user': user, 'sport': sport, 'season': season},{$inc: result})
		.then((res) => {
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
				newrecord.save()
				.catch(err => console.log(err));
			}
			logger.info(user+' had a '+category+' - '+new Date());
			resolve();
		})
		.catch(err => {
			logger.error(user+' had trouble updating wins - '+new Date());
			reject();
		});
	});
}

function updateWinnerLoser(winner, loser, push, sport){
	updateRecord(winner, (push)?'push':'win', sport, Util.seasonStart[sport].getFullYear()).then(() => {
		updatePct(winner, sport);
	});
	updateRecord(loser, (push)?'push':'loss', sport, Util.seasonStart[sport].getFullYear()).then(() => {
		updatePct(loser, sport);
	});
	// update debt counters
	if (!push) {
		Users.updateOne({_id: winner}, {$inc:{debts:(1<<4)}})
		.catch(err => logger.error(user+' had trouble updating winner debts - '+new Date()));
		Users.updateOne({_id: loser}, {$inc: {debts:1}})
		.catch(err => logger.error(user+' had trouble updating loser debts - '+new Date()));
	}
}

module.exports = {
	refreshOddsInfo: async () => {
		Sports.find({inseason: true})
		.then ((sports) => {
			sports.forEach(sport => {
				getOdds(sport.sport);
			});
		})
		.catch(err => console.log(err));
	},
	clearUnactedBets: async () => {
		// below searches for unacted bets and marks refused after game starts; '-' are saved
		Bets.find({status:{$in:[0,10,11,12]}})
		.then ((bets) => {
			bets.forEach((single) => {
				if (single.gametime < new Date()) {
					Bets.updateOne({_id:single._id},{status:3})
					.then(() => logger.info(single.team1+'/'+single.team2+' game started - unacted bets changed to refused - '+new Date()+' gametime='+single.gametime))
					.catch(err => logger.error(err))
					Users.updateOne({_id:single.user2},{$inc: {bets: -1}})
					.catch(err => logger.error(err));
				}
			});			
		})
		.catch (err => console.log(err));
	},

	dailyCleaning: () => {
		// below searches for refused bets and deletes after 2 days
		Bets.deleteMany({$or:[
							{$and:[{status:3}, {date:{$lt:new Date()-1000*60*60*48}}]},
							{$and:[{status:0}, {type: {$in: ['take', 'give']}}, {date:{$lt:new Date()}}]}]})
		.then (() => logger.info('Refused bets cleared - '+new Date()))
		.catch (err => logger.error(err));
	},

	tallyBets2: async (sprt) => {
		let teams, url, wk, today = new Date();
		let scores = {};
		
		if (today.getHours() === 0) {// for late games, if checking after midnight, need to look at previous day
			today.setHours(today.getHours()-1);
		}
		wk = Util.getWeek(new Date(), sprt);
		if (sprt=='nfl') {
			url = 'https://www.cbssports.com/nfl/scoreboard/all/'+Util.seasonStart.nfl.getFullYear()+((wk>17)?'/postseason/':'/regular/')+wk;
			teams = Util.nflTeams;
		} else {
			url = 'https://www.cbssports.com/nba/scoreboard/'+today.getFullYear()+('0'+(today.getMonth()+1)).slice(-2)+('0'+today.getDate()).slice(-2);
			teams = Util.nbaTeams;
		}
		// console.log(url);
		// first get scores for games today
		new Promise((resolve, reject) => {
			request(url, (err, response, body) => {
				if(!err && response.statusCode == 200) {
					const $ = cheerio.load(body);
					const scoresClass = $('.game-status.postgame');
					for (let idx = 0; idx < scoresClass.length; idx++){
						const teamNames = $(scoresClass[idx]).parent().next().find('.team-name-link');
						const teamScores = $(scoresClass[idx]).parent().next().find('td.total');
						scores[teams[teamNames.first().text()]] = Number(teamScores.first().text().replace(/\s/g,''));
						scores['@'+teams[teamNames.last().text()]] = Number(teamScores.last().text().replace(/\s/g,''));
					}
					resolve();
				} else {
					console.log(`Error in tallybets2: ${err}`)
				}
			});
		})
		.then(async ()=>{
			// console.log(scores);
			// next go through accepted bets for the day
			Bets.find({$and:[{status:2}, {sport:sprt}, {gametime:{$lt: new Date()}}, {score1: 0}, {score2: 0}]})				
			.then((acceptedBets) => { //get all accepted bets
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
			})
			.catch (err => console.log(err));

			// finally go through ATS odds and mark
			Odds.find({season: Util.seasonStart[sprt].getFullYear(), sport: sprt, ats: 0, date: today.setHours(0,0,0,0)}).sort({index:1})
			.then((odds) => {
				// console.log('Updating Odds');
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
						Odds.updateOne({_id: game._id}, {ats: winner, total: scores[game.team1]+scores[game.team2]})
						.catch (err => console.log('Error updating Odds winner when tallying ATS'));
					}
				});
				// see if end of day and do tally
				let promises = [];
				promises.push(new Promise((resolve, reject)=>{ // find number of games for today
					Odds.find({sport: sprt, bta: true, date: today}).sort({index:1})
					.then ((odds) => resolve(odds))
					.catch(err => reject());
				}));
				promises.push(new Promise((resolve, reject)=>{ // find number of games done today
					Odds.find({sport: sprt, bta: true, date: today, ats: {$in:[1,2,3]}}).sort({index:1})
					.then ((done) => resolve(done.length))
					.catch(err => reject());
				}));
				promises.push(new Promise((resolve, reject)=>{ // find BTA players for today
					Ats.find({sport: sprt, date: today}).sort({user:1})
					.then((picks) => resolve(picks))
					.catch(err => reject());
				}));
				Promise.all(promises).then(([btaGames, btaDoneGames, btaPlayerPicks]) =>{
					// check if any BTA game today and if all done
					if (btaPlayerPicks.length && (btaGames.length == btaDoneGames)) { 
						let playerNumCorrect = new Array(btaPlayerPicks.length).fill(0);
						btaGames.forEach((game, gameIndex) => {  // go through odds for all games
							btaPlayerPicks.forEach((user, userIndex) => {  // get correct for each person
								if (Number(user[gameIndex])==game.ats) {
									playerNumCorrect[userIndex] += 1;
								}
							});
						});
						// increment record for each user with # of picks correct and # games
						btaPlayerPicks.forEach((player, playerIndex) => {
							Records.updateOne({season: Util.seasonStart[sprt].getFullYear(), sport: (sprt=='nfl')?'btanfl':'btanba', user: player.user}, {$inc:{games: 1, correct: playerNumCorrect[playerIndex], try: btaDoneGames}})
							.then(() => console.log(`BTA record updated for ${player.user}: ${playerNumCorrect[playerIndex]} correct out of ${btaDoneGames}`))
							.catch(err => console.log('Error updating Record for user after BTA ended: ', err));
						});
						// credit winner(s)
						const maxCorrect = Math.max(...playerNumCorrect);  //find highest # correct
						let winners = [], overallWinner = [];
						playerNumCorrect.filter((correct, idx) => correct == maxCorrect ? winners.push(idx):''); //store index of people that got maxCorrect
						const lastTotal = btaGames[btaGames.length-1].total; //find total on last game
						if (winners.length > 1) { // multiple winners, look at tiebreaker for each
							let bestDiff = 999;
							winners.forEach(playerIndex=>{
								const currentDiff = Math.abs(btaPlayerPicks[playerIndex].tiebreaker - lastTotal);
								if (currentDiff < bestDiff) { // single winner
									overallWinner = [playerIndex];
								} else if (currentDiff == bestDiff) { // multiple winners
									overallWinner.push(playerIndex);
								}
								bestDiff = currentDiff;
							});								
						} else { // single winner
							overallWinner = winners;
						}
						overallWinner.forEach(playerIndex => {
							Records.updateOne({season: Util.seasonStart[sprt].getFullYear(), sport: (sprt=='nfl')?'btanfl':'btanba', user: btaPlayerPicks[playerIndex].user}, {$inc: {win: 1/overallWinner.length}})
							.then(() => {
								logger.info(`Updated BTA win for ${btaPlayerPicks[playerIndex].user} @ ${new Date()}`);
								Util.sendSlack('EVERYONE',  'BTA win goes to '+btaPlayerPicks[playerIndex].user);
							})
							.catch(err => logger.error(`Error incrementing BTA result for ${btaPlayerPicks[playerIndex].user}`));
						});
						Odds.updateMany({sport: sprt, bta: true, date: today, ats: {$in:[1,2,3]}}, {$inc: {ats: 10}}).sort({index:1})
						.then(() => logger.info('Updated BTA odds to finished'))
						.catch(err => logger.error('Error marking done games', err));
						btaPlayerPicks.forEach((player, playerIndex) => {
							if (player.user != btaPlayerPicks[winners[0]].user){
								//add bet record to track
								new Bets({
									week: wk,
									season: Util.seasonStart[sprt].getFullYear(),
									date: today.setHours(0,0,0,0),
									user1: btaPlayerPicks[winners[0]].user,
									user2: player.user,
									team1: 'BTA',
									team2: 'BTA',
									type: 'bta',
									sport: sprt,
									paid: false,
									status: 4,
								}).save()
								.then(() => logger.info('Bet added with loss for '+player.user+' to track BTA loss to '+ btaPlayerPicks[winners[0]].user))
								.catch(err => logger.error('Trouble adding betfor '+player.user+' to track BTA loss to '+ btaPlayerPicks[winners[0]].user+err));
								// mark debts
								Users.updateOne({_id: btaPlayerPicks[winners[0]].user}, {$inc:{debts:(1<<4)}})
								.catch(err => logger.error(btaPlayerPicks[winners[0]].user+' had trouble updating winner debts - '+new Date()+err));
								Users.updateOne({_id: player.user}, {$inc: {debts:1}})
								.catch(err => logger.error(player.user+' had trouble updating loser debts - '+new Date()+err));
						
							}
						});
					};
				});
			})
			.catch(err => console.log(err));
		});
	},
	updateStandings: (sport) => {
		const url = 'http://cbssports.com/'+sport+'/standings';
		request(url,  (err, response, body) => {
			if(!err && response.statusCode == 200) {
				const $ = cheerio.load(body);
				logger.info(`updating standings for ${sport} - ${new Date()}`);
				const teamInfo = $('.TableBase-bodyTr');
				for (let index=0; index < teamInfo.length; index++){
					const name = $(teamInfo[index]).find('span.TeamName').text();
					const record = [Number($(teamInfo[index]).find('.TableBase-bodyTd--number').first().text()), Number($(teamInfo[index]).find('.TableBase-bodyTd--number').first().next().text())];
					const newproj = Number(record[0])/(Number(record[0])+Number(record[1]))*((sport=='nfl')?17:82);
					OUgame.findOne({sport: sport, season: Util.seasonStart[sport].getFullYear(), team: Util.nflTeams2[name]})
					.then((rec) => {
						OUgame.updateOne({sport:sport, season: Util.seasonStart[sport].getFullYear(), team: Util.nflTeams2[name]}, {win: record[0], loss: record[1], projection: newproj, status: (Math.floor(newproj) > rec.line)?'Over':(Math.floor(newproj) < rec.line)?'Under':'Push'})
						.catch(err => logger.error('updateStandings error: '+err));
					})
					.catch(err => logger.error('OUgame find team error: '+err));
				}
				logger.info('updated standings - '+new Date());
			} else {
				console.log(`Error in updatestandings: ${err}`)
			}
		});
	},
	processOdds: (sport) => {
		const promises = []; 
		function getTeamLast10Back2Back(team){
			let last10, b2b = 0, previousGame = new Date(Util.seasonStart.nba);
			return new Promise((resolve, reject) => {
				Odds.find({season: Util.seasonStart[sport].getFullYear(), sport:sport, $or: [{team1: team},{team2: '@'+team}], ats: {$ne: 0}, bta: {$exists: false}}).limit(10).sort({date:-1})
				.then ((games) => {
					last10 = 0;
					games.reverse().forEach((game, index) => {
						if ((game.team1 == team && (game.ats == 1 || game.ats == 11)) || (game.team2 == '@'+team && (game.ats == 2 || game.ats == 12))) {
							last10 += 1;
						}
						if (index == 9 && game.date.getTime() == Util.previousDay(new Date().setHours(0,0,0,0)).getTime() && Util.previousDay(game.date).getTime() == previousGame.getTime()){
							Odds.updateOne({_id: game._id}, (game.team1 == team)?{b2b1: true}:{b2b2: true})
							.then(() => dailyB2b[team] = (game.team1 == team)?'away':'home')
							.catch(err => console.log(`Problem marking b2b for ${team}: `, err));
						}
						previousGame = game.date;
					});
					resolve ({team: team, last10: last10, b2b: b2b});
				})
				.catch(err =>{
					console.log(err);
					reject();
				})
			});
		}
		console.log(`Processing ${sport} Odds for ${new Date()}`);
		for (let teamCity in Util.nbaTeams){
			promises.push(getTeamLast10Back2Back(Util.nbaTeams[teamCity]));
		}
		Promise.all(promises).then(results => {
			results.forEach(team => {
				Tracker.updateOne({user: 'system', sport: sport, season: Util.seasonStart[sport].getFullYear(), team: team.team}, {last10: team.last10})
				.catch(err => console.log(`Problem marking last10 for ${team}: `, err));
			});
		});
	},	
	getDailyOdds: (sport) => {
		let index = 0, playsToday = [], playsToday2 = [], info = {back2back: []};
		const today = new Date();
		console.log(`getting daily odds ${today}`);
		const current = JSON.parse(fs.readFileSync('json/'+sport+'_odds.json'));
		current.games.forEach(game => {
			if (new Date(game.date).getDate() == today.getDate() && new Date(game.date).getMonth() == today.getMonth()) {  //only look at today, may include future odds
				new Odds({
					team1: game.team1,
					team2: game.team2,
					spread: game.spread,
					date: today.setHours(0,0,0,0),
					sport: sport,
					week: Util.getWeek(today, sport),
					season: Util.seasonStart[sport].getFullYear(),
					ats: 0,
					index: index++
				}).save()
				.catch(err => console.log('Error saving new odds: '+err));
				playsToday.push(game.team1, game.team2.slice(1));
				playsToday2.push('@'+game.team1, game.team2);
			}
		});
		// text B2B info
		// Odds.find({sport: sport, season: Util.seasonStart[sport].getFullYear(), date: Util.previousDay(today).setHours(0,0,0,0), bta: {$exists: false}, $or: [{team1: {$in: playsToday}}, {team2: {$in: playsToday2}}]}, (err, games) => {
		// 	if (err) {
		// 		console.log('Error finding teams tha played yesterday: ', err);
		// 	} else {
		// 		games.forEach(game => {
		// 			if (playsToday.includes(game.team1)) {
		// 				info.back2back.push(game.team1);
		// 			} else if ([playsToday.includes(game.team2.slice(1))]) {
		// 				info.back2back.push(game.team2.slice(1));
		// 			}
		// 		});
		// 		Util.sendSlack('jarma4', JSON.stringify(info));
		// 	}
		// });
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
				Tracker.updateOne({user: 'system', team: game.team1, sport: sport, season: Util.seasonStart[sport].getFullYear()}, {$inc: {away_games: 1, away_won: (game.ats==1 || game.ats==11)?1:0, b2b_games: (game.b2b1)?1:0, b2b_won: (game.b2b1 && (game.ats==1 || game.ats==11))?1:0}})
				.catch((ere) => console.log('Error updating system team1 Tracker: '+err));

				Tracker.updateOne({user: 'system', team: game.team2.slice(1), sport: sport, season: Util.seasonStart[sport].getFullYear()}, {$inc: {home_games: 1, home_won: (game.ats==2 || game.ats==12)?1:0, b2b_games: (game.b2b2)?1:0, b2b_won: (game.b2b2 && (game.ats==2 || game.ats==12))?1:0}})
				.catch(err => console.log('Error updating system team2 Tracker: '+err));

				// next look at user trackers
				results[1].forEach(user => {
					if (user[index] != undefined){ //only mark if user has pick for game
						Tracker.updateOne({user: user.user, team: game.team1, sport: sport, season: Util.seasonStart[sport].getFullYear()}, {$inc: {away_games: 1, away_won: ((game.ats==1 || game.ats==11) && user[index] == 1)?1:0, b2b_games: (game.b2b1)?1:0, b2b_won: ((game.b2b1 && (game.ats==1 || game.ats==11)) && user[index] == 1)?1:0}})
						.catcg(err => console.log(`Error updating ${user.user} team1 Tracker: `+err));
							
						Tracker.updateOne({user: user.user, team: game.team2.slice(1), sport: sport, season: Util.seasonStart[sport].getFullYear()}, {$inc: {home_games: 1, home_won: ((game.ats==2 || game.ats==12) && user[index] == 2)?1:0, b2b_games: (game.b2b2)?1:0, b2b_won: ((game.b2b2 && (game.ats==2 || game.ats==12)) && user[index] == 2)?1:0}})
						.catch(err => console.log(`Error updating ${user.user} team2 Tracker: `+err));
					}
				});
			});
		});
	}
};


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
