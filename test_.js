const {Bets, Ats, Tracker, Odds, Sports, Users, OUgame} = require('./models/dbschema');
const Scraper = require('./models/scraper');
const mongoose = require('mongoose');
const fs = require('fs');
const request = require('request');
const exec = require('child_process').exec;
const cheerio = require('cheerio');
const Util = require('./models/util');
const { getDefaultSettings } = require('http2');
const { previousDay } = require('./models/util');
const { match } = require('assert');
// const {App} = require('@slack/bolt');

process.loadEnvFile();

mongoose.set('strictQuery', true);
mongoose.connect(process.env.BAF_MONGO_URI)
.then(()=>{})
.catch(err=>{
	console.log(err);
});


// Mongo example
// OUgame.find({season:2024, sport:'nba'}).sort({index:1})
// .then(teams => {
// 	teams.forEach(team => {
// 		console.log(team.team);
// 		OUgame.updateOne({season:2024, sport:'nba', team: team.team}, {$set:{line: team.projection}})
// 		.then(() => console.log(`updated ${team}`))
// 		.catch(err => console.log('error'));
// 	});
// })
// .catch(err => console.log(err));

// Cheerio example
const options = {
    url: 'https://www.vegasinsider.com/nba/odds/las-vegas/',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
    }
}
request(options, (err, response, body) => {
	// console.log(response.statusCode);
	if(!err && response.statusCode == 200) {
		const $ = cheerio.load(body);
		const visitor = $('.divided');
		const home = $('.footer');
		// console.log('records', home.length)
		for (let idx = 0; idx < visitor.length/3; idx++){
			const gameInfo = $(visitor[idx]).find('.game-odds:nth-child(6)'); //caesars
			if ($(visitor[idx]).prev().find('span').data('value') != undefined){
				console.log($(visitor[idx]).find('.team-name').data('abbr'), 
					$(home[idx]).find('.team-name').data('abbr'), 
					gameInfo.text().trim().split('   ')[0], 
					$(visitor[idx+(visitor.length/3)]).find('.game-odds:nth-child(6)').text().trim().split('   ')[0].substring(1),
					$(visitor[idx]).prev().find('span').data('value'))
			}
		// 	const teams = $(scoresClass[idx]).parent().next().find('.team-name-link');
		// 	const scores = $(scoresClass[idx]).parent().next().find('td.total');
		// 	console.log(teams.first().text(), scores.first().text(),teams.last().text(), scores.last().text());
		}
	}
});


// process.exit(1);
