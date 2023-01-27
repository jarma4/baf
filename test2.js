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

const sport = 'nba';

const url = 'http://cbssports.com/'+sport+'/standings';
request(url, function (err, response, body) {
	if(!err && response.statusCode == 200) {
		const $ = cheerio.load(body);
		teamInfo = $('.TableBase-bodyTr');
		for (let index=0; index < teamInfo.length; index++){
			console.log(Util.nbaTeams[$(teamInfo[index]).find('span.TeamName').text()], $(teamInfo[index]).find('.TableBase-bodyTd--number').first().text(), $(teamInfo[index]).find('.TableBase-bodyTd--number').first().next().text());
		}
		// const teams = $('span.TeamName');
		// for (let index=0; index < teams.length; index++){
		// 	console.log(Util.nbaTeams[$(teams[index]).text()]);

		// }
		// Object.keys((sport=='nfl')?Util.nflTeams:Util.nbaTeams).forEach(function(name){
		// 	let record = $('.table a:contains('+name+')').parent().next().text().split('-');
		// 	// console.log(name,record);
		// 	let newproj = Number(record[0])/(Number(record[0])+Number(record[1]))*((sport=='nfl')?17:82);
		// 	OUgame.findOne({sport: sport, season: Util.seasonStart[sport].getFullYear(), team: name}, function(err, rec) {
		// 		if (err)
		// 			logger.error('OUgame find team error: '+err);
		// 		else if(rec) {
		// 			OUgame.updateOne({sport:sport, season: Util.seasonStart[sport].getFullYear(), team: name}, {win: record[0], loss: record[1], projection: newproj, status: (Math.floor(newproj) > rec.line)?'Over':(Math.floor(newproj) < rec.line)?'Under':'Push'}, function(err, resp){
		// 				if (err)
		// 					logger.error('updateStandings error: '+err);
		// 			});
		// 		}
		// 	});
		// });
		// logger.info('updated standings - '+new Date());
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
