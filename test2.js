const {Ats, Tracker, Odds, Sports} = require('./models/dbschema');
const Scraper = require('./models/scraper');
const mongoose = require('mongoose');
const fs = require('fs');
const request = require('request');
const exec = require('child_process').exec;
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const Util = require('./models/util');
const { getDefaultSettings } = require('http2');
const { previousDay } = require('./models/util');
const { match } = require('assert');

require('dotenv').config();
mongoose.connect(process.env.BAF_MONGO_URI)
.then(()=>{})
.catch(err=>{
	console.log(err);
});

let teams, url, wk, today = new Date();
let scores = {};

const sport = 'nba';
url = 'https://www.cbssports.com/nba/scoreboard/'+today.getFullYear()+('0'+(today.getMonth()+1)).slice(-2)+('0'+today.getDate()).slice(-2);
teams = Util.nbaTeams2;
console.log(url);
request(url, function (err, response, body) {
	if(!err && response.statusCode == 200) {
		const $ = cheerio.load(body);
		const scoresClass = $('.single-score-card.postgame');
		console.log(scoresClass.length);
		for (let idx = 0; idx < scoresClass.length; idx++){
			const matchup = $(scoresClass[idx]).find('a:nth-child(2)');
			scores[teams[matchup.first().text()]] = Number(matchup.first().parent().parent().find('td').last().text().replace(/\s/g,''));
			scores['@'+teams[matchup.last().text()]] = Number(matchup.last().parent().parent().find('td').last().text().replace(/\s/g,''));
		}
		console.log(scores);
	}
});

// let playsToday = [], playsToday2 = [], info = {back2back: []};
// const sport = 'nba';
// const today = new Date();
// console.log(`getting daily odds ${today}`);
// const current = JSON.parse(fs.readFileSync('json/'+sport+'_odds.json'));
// current.games.forEach(game => {
// 	if (new Date(game.date).getDate() == today.getDate() && new Date(game.date).getMonth() == today.getMonth()) {  //only look at today, may include future odds
// 		playsToday.push(game.team1, game.team2.slice(1));
// 		playsToday2.push('@'+game.team1, game.team2);
// 	}
// });
// Odds.find({sport: sport, season: Util.seasonStart[sport].getFullYear(), date: previousDay(today).setHours(0,0,0,0), bta: {$exists: false}, $or: [{team1: {$in: playsToday}}, {team2: {$in: playsToday2}}]}, (err, games) => {
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
// 		console.log(info);
// 	}

// });

// request(url, function (err, response, body) {
// 	if(!err && response.statusCode === 200) {
		// let $ = cheerio.load(fs.readFileSync('./body.html'));
		// // get matchup w/ team names & date
		// let pingpong = 0,
		// games = [],
		// matchup = {};					
		// let today = new Date();
		// $('.op-block__matchup-time').each((index, element)=>{
		// 	console.log(index,$(this).text());
		// });
// 	}
// });
	
// process.exit(1);
