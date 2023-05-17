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

// require('dotenv').config();
// mongoose.connect(process.env.BAF_MONGO_URI)
// .then(()=>{})
// .catch(err=>{
// 	console.log(err);
// });
let plivo = require('plivo');
let client = new plivo.Client();
client.messages.create({
    src: '+16282390413',
    dst: '+15122937112',
    text: 'From Plivo'
}).then(function(message_created) {
    console.log(message_created)
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
