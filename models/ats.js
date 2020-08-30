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
	let week = Util.getWeek(new Date(), 'nfl');
	current.games.forEach(game => {
		if (Util.getWeek(new Date(game.date), 'nfl') == week) {  //only look at this week
			Odds.updateOne({team1: game.team1, team2: game.team2, week: week}, {spread: game.spread}, (err, result) => {
				if(result.nModified) {
					console.log('Odds modified');
				} else if (!result.n) {
					new Odds({
						team1: game.team1,
						team2: game.team2,
						spread: game.spread,
						date: game.date,
						sport: 'nfl',
						week: week,
						season: seasonStart[sport].getFullYear(),
						ats: 0,
						index: index++
					}).save(err2 => {
						if(err2)
							console.log('Error saving new odds: '+err);
						else
							console.log('New ATS odds saved');
					});
				}
			});
		}
	});
	console.log('Copied ATS odds for week');
},
getAts: (season, week, sort) => {
	let results = [], playerPromises = [];
	return new Promise((resolve, reject) =>{
		Odds.find({sport:'nfl', season: season, week: week}, (err, odds) => {
			Ats.find({season: season, week: week}, {'user': 1, '0': 1, '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, '8': 1, '9': 1, '10': 1, '11': 1, '12': 1, '13': 1, '14': 1, '15': 1}, (err, players) => {
				if (err) {
					console.log("Test error: "+err);
				} else {
					players.forEach(choices => {
						playerPromises.push(new Promise((resolve, reject) =>{
							let index=0, score = 0;
							for(let key=0; key < odds.length; key++) {
								if(choices[key] == odds[key].ats) {
									++score;
								}
							}
							results.push({user: choices.user, win: score});
							resolve();
						}));
					});
					Promise.all(playerPromises).then(() => {
						resolve (results);
					});
				}
			}).sort({user: 1});
		}).sort({index: 1});  //wasn't being sorted prior to week 14; frontend has it's own algorithm similar to this one when displaying, this used when saving weekly totals
	});
},
tallyAts: (season, week) => {
	module.exports.getAts(season, week).then(results => {
		let high = 0;
		let winners = [];
		results.forEach(record => {
			if (record.win > high) {  // check if new high for the week
				winners = [record.user];
				high = record.win;
			} else if (record.win == high) {  // check if multiple people with high
				winners.push(record.user);
			}
			// update each user's win total
			Records.update({season: season, sport: 'ats', user: record.user}, {$inc:{win: record.win}}, err => {
				console.log('updating record');
				if (err)
					console.log('Error incrementing ATS record: '+err);
			});
		});
		// mark weekly winner
		winners.forEach(winner => {
			Records.update({season: season, sport: 'ats', user: winner}, {$inc:{pct: 1/winners.length}}, err => {
				if (err)
					console.log('Error incrementing $5 bonus winner: '+err);
			});
		});
	});
}
