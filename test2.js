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

function changeTime(time){ // time is in ET
	const timeSplit=time.slice(0,-2).split(':');
	return String(Number(timeSplit[0])+((time.slice(-2)=='pm')?11:-1)+':'+timeSplit[1]);
}
const sport = 'nba';
let  games = [];
const today = new Date();
let teamNames, tempDate, spread;
const url = 'https://www.oddsshark.com/'+((sport=='soccer')?'soccer/world-cup':sport)+'/odds';
request(url, function (err, response, body) {
	if(!err && response.statusCode == 200) {
		const $ = cheerio.load(body);
		const matchups = $('.odds--group__event-participants');
		const times = $('.odds--group__event-time');
		const odds = $('.book-5580');
		for (let idx = 0; idx < matchups.length; idx++){
			spread = $(odds[idx]).find('.odds-spread');
			teamNames = $(matchups[idx]).find('.participant-name');
			tempDate = $(matchups[idx]).parent().parent().prev().find('.short-date').text().split(' ');
			games.push({
				date: new Date(tempDate[1]+' '+tempDate[2]+' '+((today.getMonth() == 11 && Util.monthName.indexOf(tempDate[1]) == 0)?today.getFullYear()+1:today.getFullYear())+' '+changeTime($(times[idx]).text().split(' ')[0])),
				team1: (sport == 'nfl')?Util.nflTeams[teamNames.first().attr('title')]:(sport == 'nba')?Util.nbaTeams[teamNames.first().attr('title')]:teamNames.first().attr('title'),
				team2: (sport == 'nfl')?Util.nflTeams[teamNames.last().attr('title')]:(sport == 'nba')?Util.nbaTeams[teamNames.last().attr('title')]:teamNames.last().attr('title'),
				spread: (spread.children().attr('data-odds-spread'))?JSON.parse(spread.children().attr('data-odds-spread')).fullgame:'--',
				over: (spread.next().next().children().attr('data-odds-total'))?JSON.parse(spread.next().next().children().attr('data-odds-total')).fullgame:'--'
			});
		}
		console.log(games);
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
