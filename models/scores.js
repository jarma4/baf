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
getHalftimeScores2: async () => {
	let today = new Date();
	let results = [];
	const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
	const page = await browser.newPage();
	await page.goto('https://www.oddsshark.com/nba/scores');
	console.log('checking halftime');
	let content = await page.content();
	await browser.close();
	// fs.writeFile('page.html', content, _ => console.log('HTML saved'));
	let $ = cheerio.load(content);
	
	$('.matchup.live').each((idx, game) => {
		if ($(game).children('.status').text() == 'end - 2nd') {
			results.push({
				team1: $(game).find('.text').eq(0).text(),
				score1: $(game).find('.total-score').eq(0).text(),
				team2: $(game).find('.text').eq(1).text(), 
				score2: $(game).find('.total-score').eq(1).text()
			});
		}
	});

	return results;
},

			
getHalftimeScores: async () => {
	let today = new Date();
	const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
	const page = await browser.newPage();
	await page.goto('https://www.oddsshark.com/nba/scores');
	console.log('checking halftime');
	let content = await page.content();
	await browser.close();
	// fs.writeFile('page.html', content, _ => console.log('HTML saved'));
	let $ = cheerio.load(content);
	$('.matchup.live').each((idx, game) => {
		if ($(game).children('.status').text() == 'end - 2nd') {
			console.log($(game).find('.text').eq(0).text(),$(game).find('.total-score').eq(0).text());
			console.log($(game).find('.text').eq(1).text(), $(game).find('.total-score').eq(1).text());
			Scores.findOneAndUpdate({$and:[{season:seasonStart[sport].getFullYear()},
													{sport:'nba'}, 
													{$and:[{date:{$gte:today.setHours(0,0,0,0)}}, {date:{$lt:today.setHours(23,59)}},
													{'1h1': 0}]}, 
													{team1: $(game).find('.text').eq(0).text()}, 
													{team2: $(game).find('.text').eq(1).text()}]}, {'1h1': $(game).find('.total-score').eq(0).text(), '1h2': $(game).find('.total-score').eq(1).text()}, err => {
				if(err) {
					console.log('Error updating firsthalf score: ', err);
				} else {
					console.log('Updated firsthalf score');
				}
			});
		}
	});
},

checkScores: function(sport) {
	let teams, url, wk, today = new Date();
	// for late games, checking after midnight need to look at previous day
	if (today.getHours() === 0)
		today.setHours(today.getHours()-1);
	if (sport=='nfl') {
		wk = Util.getWeek(new Date(), sport);
		url = 'https://www.si.com/nfl/scoreboard?week=1%2C'+wk;
		teams = nflTeams2;
	} else {
		url = 'https://www.cbssports.com/nba/scoreboard/'+today.getFullYear()+('0'+(today.getMonth()+1)).slice(-2)+('0'+today.getDate()).slice(-2);
		teams = nbaTeams2;
	}
	// console.log('checking scores @ '+url);
	request(url, function (err, response, body) {
		if(!err && response.statusCode == 200) {
			let $ = cheerio.load(body);
			$('.single-score-card.postgame').each(function(){
				tm1 = teams[$(this).find('a.team').first().text()];
				sc1 = $(this).find('a.team').first().parent().parent().find('td').last().text().replace(/\s/g,'');
				tm2 =teams[$(this).find('a.team').last().text()];
				sc2 = $(this).find('a.team').last().parent().parent().find('td').last().text().replace(/\s/g,'');
				console.log(tm1+':'+sc1+' '+tm2+':'+sc2);
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
			});
		}
	});
},


function addNflWeek (wk, yr, sprt) {
	let url = 'https://www.si.com/nfl/scoreboard?week=1%2C'+wk;
	request(url, function (err, response, body) {
		if(!err && response.statusCode === 200) {
			let $ = cheerio.load(body), pingpong = 0, team1;
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
   let url = 'https://www.cbssports.com/nba/scoreboard/'+date.getFullYear()+('0'+(date.getMonth()+1)).slice(-2)+('0'+date.getDate()).slice(-2),
      dateCopy = new Date(date);
	console.log(url);
	request(url, function (err, response, body) {
		if(!err && response.statusCode === 200) {
			let $ = cheerio.load(body);
			$('.single-score-card.nba').each(function(){
				// console.log(nbaTeams2[$(this).find('a.team').first().text()]+' vs '+nbaTeams2[$(this).find('a.team').last().text()]);
				let tmp = new Scores({
					score1: 0,
					score2: 0,
					winner: 0,
					season: seasonStart[sport].getFullYear(),
					sport: 'nba',
					date: dateCopy,
					team1: nbaTeams2[$(this).find('a.team').first().text()],
					team2: nbaTeams2[$(this).find('a.team').last().text()]
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

function getScore(sport, team1, team2){
	let teams, url, wk, today = new Date();
	let sc1, sc2;
	// for late games, checking after midnight need to look at previous day
	if (today.getHours() === 0)
		today.setHours(today.getHours()-1);
	if (sport=='nfl') {
		wk = Util.getWeek(new Date(), sport);
		url = 'https://www.si.com/nfl/scoreboard?week=1%2C'+wk;
		teams = nflTeams2;
	} else {
		url = 'https://www.cbssports.com/nba/scoreboard/'+today.getFullYear()+('0'+(today.getMonth()+1)).slice(-2)+('0'+today.getDate()).slice(-2);
		teams = nbaTeams2;
	}
	// console.log('checking scores @ '+url);
	request(url, function (err, response, body) {
		if(!err && response.statusCode == 200) {
			let $ = cheerio.load(body);
			let tm1, tm2;
			let results = $('.single-score-card.postgame')
			for (let i = 0; i < results.length; i++){
				tm1 = teams[$(results[i]).find('a.team').first().text()];
				if (tm1 != team1 && tm1 != team2 ) {
					continue; // not the game, look at next
				}
				tm2 =teams[$(results[i]).find('a.team').last().text()];
				if (tm2 == team1 || tm2 == team2 ){ //found game
					sc1 = $(results[i]).find('a.team').first().parent().parent().find('td').last().text().replace(/\s/g,'');
					sc2 = $(results[i]).find('a.team').last().parent().parent().find('td').last().text().replace(/\s/g,'');
					break;
				}

			};
			let ret = [sc1,sc2]; 
			console.log(sc1);
			return (sc1);
		}
	});
}

function checkHalftime() {
	return new Promise(async (resolve, reject) => {
		let day = new Date().getDay();
		let hour = new Date().getHours();
      let results = [];
      
      if((day > 0 && day < 6 && hour > 18 && hour < 23) || ((day == 0 || day == 6) && hour > 15 && hour < 23)) {
         const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
         const page = await browser.newPage();
         await page.goto('https://www.oddsshark.com/nba/scores');
         // console.log('checking halftime',new Date());
         let content = await page.content();
         await browser.close();
         // fs.writeFile('page.html', content, _ => console.log('HTML saved'));
         let $ = cheerio.load(content);
         
         $('.matchup.live').each((idx, game) => {
            if ($(game).children('.status').text() == 'end - 2nd') {
               results.push({
                  team1: $(game).find('.text').eq(0).text(),
                  score1: $(game).find('.total-score').eq(0).text(),
                  team2: $(game).find('.text').eq(1).text(), 
                  score2: $(game).find('.total-score').eq(1).text()
               });
               Scores.findOneAndUpdate({$and:[{season:seasonStart[sport].getFullYear()},
                  {sport:'nba'}, 
                  {$and:[{date:{$gte:new Date().setHours(0,0,0,0)}}, {date:{$lt:new Date().setHours(23,59)}},
                  {'1h1': 0}]}, 
                  {team1: $(game).find('.text').eq(0).text()}, 
                  {team2: $(game).find('.text').eq(1).text()}]}, {'1h1': $(game).find('.total-score').eq(0).text(), '1h2': $(game).find('.total-score').eq(1).text()}, (err, rec) => {
                     if(err) {
                        console.log('Error updating firsthalf score: ', err);
                     } else if (rec) {
								console.log(`Updated firsthalf score ${rec.team1} vs ${rec.team2}`);
                     }
               });
            }
         });
      }

		resolve (results);
	});
};

checkHalftime().then(halftime => {
	// halftime = [{
	// 	"team1": "SAN",
	// 	"score1": "53",
	// 	"team2": "SAC",
	// 	"score2": "54"
	// }];
	// got through games@halftime and mark in games array
	halftime.forEach(rec =>{
		for(let game of games) {
			if(game.team1 == rec.team1) {
				game.inhalftime = true;
				break;
			}
		};
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
});
