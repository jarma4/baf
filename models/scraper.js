const { resolve } = require('path');
const P = require('pino');
const { Sports, Odds } = require('./dbschema');
const { getWeek, seasonStart } = require('./util');

const request = require('request'),
	fs = require('fs'),
	cheerio = require('cheerio'),
	logger = require('pino')({}, fs.createWriteStream('./json/log.json', {'flags': 'a'})),
	Util = require('./util'),
	Users = require('./dbschema').Users,
	Bets = require('./dbschema').Bets,
	Records = require('./dbschema').Records,
	// Scores = require('./dbschema').Scores,
	OUgame = require('./dbschema').OUgame,
	Ats = require('./dbschema').Ats,
	// Odds = require('./dbschema').Odds,
	Api = require('../routes/api'),
	puppeteer = require('puppeteer');
	// mongoose = require('mongoose');

function getOdds(sport) {
	let url = 'http://www.oddsshark.com/'+((sport=='soccer')?'soccer/world-cup':sport)+'/odds';
	// console.log(`checking odds ${sport} @ ${url}`);
	request(url, function (err, response, body) {
		if(!err && response.statusCode == 200) {
			let $ = cheerio.load(body);

			// get matchup w/ team names & date
			let pingpong = 0,
			games = [],
			matchup = {};
			$('.op-matchup-team','#op-content-wrapper').not('.no-odds-wrapper').each(function(){
					if (pingpong++ % 2){
						matchup.team2 = '@'+JSON.parse($(this).attr('data-op-name')).short_name;
						games.push(matchup);
						matchup = {};
					}
					else {
						let tempdate = JSON.parse($(this).parent().parent().prevAll('.no-group-name').last().attr('data-op-date')).short_date; //prevAll gives list, closest one is always last
                  let temptime = $(this).parent().prev().prev().text().split(':');
						matchup.date = new Date(tempdate+' '+new Date().getFullYear()+' '+(Number(temptime[0])+Number((temptime[1].slice(-1) == 'p')?11:-1))+':'+temptime[1].slice(0,2));
						matchup.team1 = JSON.parse($(this).attr('data-op-name')).short_name;
						tempdate='';
					}
				});

			// get odds for matchups 
			let gameIndex = 0;
			$('.op-item-row-wrapper','#op-results').not('.no-odds-wrapper').each(function(){
				// fix: games found above may not have odds (.no-odds-wrapper) but be followed by ones that do so the gameIndex will be wrong and odds will be put on wrong game
				// if ($(this).not('.no-odds')) {  
					let tmp = $(this).find($('.op-bovada\\.lv'));
					if ($(tmp).attr('data-op-info') != undefined) {
						if (JSON.parse($(tmp).attr('data-op-info')).fullgame != 'Ev') {
							games[gameIndex].spread = Number(JSON.parse($(tmp).attr('data-op-info')).fullgame);
						}
						else {
							games[gameIndex].spread = 0;
						}
						games[gameIndex].firsthalf = Number(JSON.parse($(tmp).attr('data-op-info')).firsthalf);
						games[gameIndex].secondhalf = Number(JSON.parse($(tmp).attr('data-op-info')).secondhalf);
						games[gameIndex].over = Number(JSON.parse($(tmp).attr('data-op-total')).fullgame);
						games[gameIndex].moneyline1 = Number(JSON.parse($(tmp).attr('data-op-moneyline')).fullgame);
						games[gameIndex].moneyline2 = Number(JSON.parse($(tmp).parent().next().children().attr('data-op-moneyline')).fullgame);
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
	Bets.update({_id:id},{$set:object},function(err){
		if (err)
			logger.error(id+' had trouble updating - ');
		else
			logger.info(id+' bet updated - '+new Date());
	});
}

function updatePct (user, sport) {
	Records.findOne({user: user, sport: sport, season: Util.seasonStart[sport].getFullYear()}, function(err, record) {
		Records.update({_id: record._id}, {pct: (record.win+0.5*record.push)/(record.win+record.loss+record.push)}, function(err, resp){
			if (err)
				console.log('pct error');
		});
	});
}

function updateRecord(user, category, sport, season) {
	return new Promise(function(resolve, reject){
		let result = {};
		result[category] = 1;
		Records.update({'user': user, 'sport': sport, 'season': season},{$inc: result}, function(err, res){
			if (err) {
				logger.error(user+' had trouble updating wins - '+new Date());
				reject();
			} else {
				if (!res.n){ // didn't actually update because no record, create one
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
		
		if (today.getHours() === 0) {// for late games, checking after midnight need to look at previous day
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
					let $ = cheerio.load(body);
					let scoresClass = $('.single-score-card.postgame');
					for (let idx = 0; idx < scoresClass.length; idx++){
						scores[teams[$(scoresClass[idx]).find('a.team').first().text()]] = Number($(scoresClass[idx]).find('a.team').first().parent().parent().find('td').last().text().replace(/\s/g,''));
						scores['@'+teams[$(scoresClass[idx]).find('a.team').last().text()]] = Number($(scoresClass[idx]).find('a.team').last().parent().parent().find('td').last().text().replace(/\s/g,''));
					}
					resolve();
				}
			});
		})
		.then(()=>{
			// console.log(scores);
			// next go through accepted bets for the day
			Bets.find({$and:[{status:2}, {sport:sprt}, {gametime:{$lt: new Date()}}]}, (err, acceptedBets) => { //get all accepted bets
				acceptedBets.forEach(singleBet => {
					if (singleBet.type == 'spread') {
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
					} else {
						console.log(singleBet.type, singleBet.odds, scores[singleBet.team1]+scores[singleBet.team2])
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
			Odds.find({season:2020, sport: sprt, ats: 0, date: today.setHours(0,0,0,0)}, (err, odds)=>{
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
						Odds.updateOne({_id: game._id}, {ats: winner}, err => {
							if (err) {
								console.log('Error updating Odds winner when tallying ATS');
							} else {
								// console.log(game._id, winner);
							}
						});
					});
					// see if end of day and do tally
					let promises = [];
					promises.push(new Promise((resolve, reject)=>{ // find number of games for today
						Odds.find({date: new Date().setHours(0,0,0,0)}, (err, odds) => {
							if(err) {
								reject();
							} else {
								resolve(odds);
							}
						}).sort({index:1});
					}));
					promises.push(new Promise((resolve, reject)=>{ // find number of games done today
						Odds.find({date: new Date().setHours(0,0,0,0), ats: {$in:[1,2,3]}}, (err, done) => {
							if(err) {
								reject();
							} else {
								resolve(done.length);
							}
						}).sort({index:1});
					}));
					promises.push(new Promise((resolve, reject)=>{ // find players for today
						Ats.find({date: new Date().setHours(0,0,0,0)}, (err, picks) => {
							if(err) {
								reject();
							} else {
								resolve(picks);
							}
						}).sort({user:1});
					}));
					Promise.all(promises).then(retData =>{
						if (retData[0].length && (retData[0].length == retData[1])) { // if there were games today and all done
							let totals = new Array(retData[2].length).fill(0);
							retData[0].forEach((rec, i) => {  // go through odds for all games
								retData[2].forEach((user, j) => {  // check vs each person
									if (Number(user[i])==rec.ats) {
										totals[j] += 1;
									}
								});
							});
							let max = Math.max(...totals);
							let winners = [];
							totals.filter((el, idx) => el == max ? winners.push(idx):'');
							winners.forEach(idx => { // credit winner(s)
								Records.updateOne({season:2020, sport:'bta', user: retData[2][idx].user}, {$inc: {win: 1/winners.length}}, err => {
									if (err) {
										console.log(`Error incrementing BTA result for ${retData[2][idx].user}`);
									} else {
										console.log(`Updated BTA win for ${retData[2][idx].user}`);
									}
								});
							});
							Odds.updateMany({date: new Date().setHours(0,0,0,0), ats: {$in:[1,2,3]}}, {$inc: {ats: 10}}, (err, done) => { 
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

	atsTotals:  sport => {
		let today = new Date(2021,1,5);
		let u = [];
		let promises = [];
		let totals = new Array(20).fill(0); // less than 20 player in 2db, initialize everyone to 0

		Odds.find({season:2020, sport: sport, date: today.setHours(0,0,0,0)}, (err, odds)=>{
			if (err) {
				console.log('Error getting odds when doing ATS totals');
			} else if (odds.length) {
				Ats.find({season:2020, sport: sport, date: today.setHours(0,0,0,0)}, (err2, users) => {
					if (err2) {
						console.log('Error finding ATS users when doing ATS totals');
					} else if (users.length){
						odds.forEach((rec, oddsIndex) => {
							users.forEach((user, userIndex) => {  // show each user's pick
								if (Number(user[oddsIndex])==rec.ats) {
									totals[userIndex] += 1;
								}
							});
						});
						console.log(totals);
						console.log(Math.max(...totals));
					}
				}).sort({user:1});
			}
		}).sort({index:1});

	},

	updateStandings: function(sport){
		const url = 'http://www.oddsshark.com/'+sport+'/ats-standings';
		request(url, function (err, response, body) {
			if(!err && response.statusCode == 200) {
				const $ = cheerio.load(body);
				// console.log('starting update '+sport);
				Object.keys((sport=='nfl')?Util.nflTeams:Util.nbaTeams).forEach(function(name){
               let record = $('.table a:contains('+name+')').parent().next().text().split('-');
               // console.log(name,record);
					let newproj = Number(record[0])/(Number(record[0])+Number(record[1]))*((sport=='nfl')?16:72);
					OUgame.findOne({sport: sport, season: Util.seasonStart[sport].getFullYear(), team: name}, function(err, rec) {
						if (err)
							logger.error('OUgame find team error: '+err);
						else if(rec) {
							OUgame.update({sport:sport, season: Util.seasonStart[sport].getFullYear(), team: name}, {win: record[0], loss: record[1], projection: newproj, status: (Math.floor(newproj) > rec.line)?'Over':(Math.floor(newproj) < rec.line)?'Under':'Push'}, function(err, resp){
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
};
